import { spawn } from 'child_process';
import * as fs from 'fs';
import { promises as fsPromises } from 'fs';
import * as os from 'os';
import * as path from 'path';

import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  RequestTimeoutException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MarkdownDocx } from '@zennomi/markdown-docx';
import {
  AlignmentType,
  BorderStyle,
  FileChild,
  Paragraph,
  patchDocument,
  PatchType,
  Table,
  TableCell,
  TableRow,
  TextRun,
  VerticalAlign,
  WidthType,
} from 'docx';

import type { LocaleDictionary } from '@/common/types/document.type';
import type { AllConfigType } from '@/config/config.type';
import {
  DOCX_BORDER_NONE,
  LOCALE_DICTIONARY,
  MARKITDOWN_TIMEOUT_MS,
} from '@/constants/document.constant';
import { FileStorageService } from '@/libs/file-storage/file-storage.service';

import { ConvertDocxToMarkdownDto } from './dto/convert-docx-to-markdown.dto';
import {
  GenerateDocxDto,
  GenerateDocxLocale,
  type GeneratedQuestionDto,
  GeneratedQuestionFormat,
} from './dto/generate-docx.dto';

@Injectable()
export class DocumentService {
  constructor(
    private readonly configService: ConfigService<AllConfigType>,
    private readonly fileStorageService: FileStorageService,
  ) {}

  async generateDocx({ title, locale, questions, options }: GenerateDocxDto) {
    const paragraphs: FileChild[] = [];
    const localeKey = locale ?? GenerateDocxLocale.VI;
    const labels = LOCALE_DICTIONARY[localeKey];
    const includeSolutions = options?.includeSolutions ?? true;
    const preparedQuestions = this.prepareQuestions(questions, {
      shuffleChoices: options?.shuffleChoices,
      shuffleQuestions: options?.shuffleQuestions,
    });

    const titleParagraph = new Paragraph({
      children: [
        new TextRun({
          text: title || labels.defaultTitle,
          font: 'Cambria Math',
          bold: true,
        }),
      ],
      alignment: AlignmentType.CENTER,
    });

    const questionParagraphs: FileChild[] = [];
    const solutionParagraphs: FileChild[] = [];

    for (const [index, question] of preparedQuestions.entries()) {
      const questionComponents = await this.renderQuestion(
        question,
        index,
        labels,
      );
      questionParagraphs.push(...questionComponents);

      if (!includeSolutions) {
        continue;
      }

      const questionSolutions = await this.renderQuestionSolution(
        question,
        index,
        labels,
      );
      solutionParagraphs.push(...questionSolutions);
    }

    paragraphs.push(...questionParagraphs);

    if (includeSolutions && solutionParagraphs.length > 0) {
      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: labels.solutionsTitle,
              bold: true,
              font: 'Cambria Math',
              size: 28,
            }),
          ],
          alignment: AlignmentType.CENTER,
          pageBreakBefore: true,
        }),
      );
      paragraphs.push(new Paragraph({}));
      paragraphs.push(...solutionParagraphs);
    }

    const templatePath = path.join(
      process.cwd(),
      'src/utils/docx/test_template.docx',
    );
    const template = fs.readFileSync(templatePath);

    const doc = await patchDocument({
      outputType: 'nodebuffer',
      data: template,
      patches: {
        main_patch: {
          type: PatchType.DOCUMENT,
          children: paragraphs,
        },
        title_patch: {
          type: PatchType.DOCUMENT,
          children: [titleParagraph],
        },
      },
    });

    const buffer = Buffer.from(doc);
    const filename = this.buildFileName(title, preparedQuestions.length);
    const url = await this.fileStorageService.saveFile(
      buffer,
      filename,
      'docx',
    );
    const relativePath = path.posix.join('/uploads', 'docx', filename);

    return {
      url,
      filename,
      path: relativePath,
    };
  }

  private prepareQuestions(
    questions: GeneratedQuestionDto[],
    options: {
      shuffleChoices?: boolean;
      shuffleQuestions?: boolean;
    },
  ): GeneratedQuestionDto[] {
    const clonedQuestions = questions.map((question) =>
      this.cloneQuestion(question),
    );

    const questionsWithPreparedChoices = options.shuffleChoices
      ? clonedQuestions.map((question) => this.shuffleMultipleChoice(question))
      : clonedQuestions;

    if (!options.shuffleQuestions) {
      return questionsWithPreparedChoices;
    }

    return this.shuffleArray(questionsWithPreparedChoices);
  }

  private cloneQuestion(question: GeneratedQuestionDto): GeneratedQuestionDto {
    return {
      ...question,
      answers: Array.isArray(question.answers)
        ? [...question.answers]
        : question.answers,
      choices: question.choices ? [...question.choices] : undefined,
      statements: question.statements ? [...question.statements] : undefined,
    };
  }

  private shuffleMultipleChoice(
    question: GeneratedQuestionDto,
  ): GeneratedQuestionDto {
    if (
      question.format !== GeneratedQuestionFormat.MULTIPLE_CHOICE ||
      !question.choices?.length ||
      typeof question.answer !== 'number'
    ) {
      return question;
    }

    const indexedChoices = question.choices.map((choice, index) => ({
      choice,
      index,
    }));
    const shuffledChoices = this.shuffleArray(indexedChoices);
    const remappedAnswer = shuffledChoices.findIndex(
      (choice) => choice.index === question.answer,
    );

    return {
      ...question,
      answer: remappedAnswer,
      choices: shuffledChoices.map((choice) => choice.choice),
    };
  }

  private shuffleArray<T>(items: T[]): T[] {
    const output = [...items];

    for (let i = output.length - 1; i > 0; i -= 1) {
      const randomIndex = Math.floor(Math.random() * (i + 1));
      [output[i], output[randomIndex]] = [output[randomIndex], output[i]];
    }

    return output;
  }

  private async renderQuestion(
    question: GeneratedQuestionDto,
    index: number,
    labels: LocaleDictionary,
  ): Promise<FileChild[]> {
    const paragraphs: FileChild[] = [];
    const sanitizedQuestion = this.sanitizeEquationDelimiters(
      question.question,
    );
    const questionComponents = await this.renderMarkdown(sanitizedQuestion);

    this.prependPrefixToFirstParagraph(
      questionComponents,
      `${labels.questionPrefix} ${index + 1}: `,
    );
    paragraphs.push(...questionComponents);

    if (question.format === GeneratedQuestionFormat.MULTIPLE_CHOICE) {
      if (question.choices?.length) {
        paragraphs.push(await this.createChoicesTable(question.choices));
      }
    }

    if (question.format === GeneratedQuestionFormat.TRUE_FALSE) {
      for (const [statementIndex, statement] of (
        question.statements ?? []
      ).entries()) {
        const sanitizedStatement = this.sanitizeEquationDelimiters(statement);
        const statementComponents =
          await this.renderMarkdown(sanitizedStatement);

        const choiceLetter = String.fromCharCode(97 + statementIndex);
        this.prependPrefixToFirstParagraph(
          statementComponents,
          `${choiceLetter}) `,
        );
        paragraphs.push(...statementComponents);
      }
    }

    paragraphs.push(new Paragraph({}));

    return paragraphs;
  }

  private prependPrefixToFirstParagraph(
    components: FileChild[],
    prefix: string,
  ): void {
    if (components[0] instanceof Paragraph) {
      components[0].addRunToFront(this.createBoldRun(prefix));
      return;
    }

    components.unshift(
      new Paragraph({
        children: [this.createBoldRun(prefix)],
      }),
    );
  }

  private async createChoicesTable(choices: string[]): Promise<Table> {
    const rows: TableRow[] = [];

    for (let i = 0; i < choices.length; i += 2) {
      const cells: TableCell[] = [];

      cells.push(await this.createChoiceCell(choices[i], i));

      if (i + 1 < choices.length) {
        cells.push(await this.createChoiceCell(choices[i + 1], i + 1));
      } else {
        cells.push(this.createEmptyCell());
      }

      rows.push(new TableRow({ children: cells }));
    }

    return new Table({
      rows,
      width: {
        size: 100,
        type: WidthType.PERCENTAGE,
      },
      borders: {
        ...DOCX_BORDER_NONE,
        insideHorizontal: {
          style: BorderStyle.NONE,
          size: 0,
          color: 'auto',
        },
        insideVertical: {
          style: BorderStyle.NONE,
          size: 0,
          color: 'auto',
        },
      },
    });
  }

  private async renderQuestionSolution(
    question: GeneratedQuestionDto,
    index: number,
    labels: LocaleDictionary,
  ): Promise<FileChild[]> {
    const paragraphs: FileChild[] = [
      new Paragraph({
        children: [
          this.createBoldRun(`${labels.questionPrefix} ${index + 1}: `),
        ],
      }),
    ];

    const answerParagraphs = await this.buildAnswerParagraphs(question, labels);
    paragraphs.push(...answerParagraphs);

    if (question.solution) {
      const sanitizedSolution = this.sanitizeEquationDelimiters(
        question.solution,
      );
      const solutionComponents = await this.renderMarkdown(sanitizedSolution);

      paragraphs.push(
        new Paragraph({
          children: [this.createBoldRun(`${labels.detailedSolutionLabel}: `)],
        }),
      );
      paragraphs.push(...solutionComponents);
    }

    paragraphs.push(
      new Paragraph({
        children: [this.createBoldRun(`${labels.metadataTitle}: `)],
      }),
      this.createLabelParagraph(labels.gradeLabel, String(question.grade)),
      this.createLabelParagraph(labels.textbookLabel, question.textbook),
      this.createLabelParagraph(labels.unitLabel, question.unit),
      this.createLabelParagraph(labels.lessonLabel, question.lesson),
      this.createLabelParagraph(labels.typeLabel, question.type),
      new Paragraph({}),
    );

    return paragraphs;
  }

  private async buildAnswerParagraphs(
    question: GeneratedQuestionDto,
    labels: LocaleDictionary,
  ): Promise<FileChild[]> {
    if (question.format === GeneratedQuestionFormat.MULTIPLE_CHOICE) {
      if (typeof question.answer !== 'number') {
        return [];
      }

      const answerLabel = String.fromCharCode(65 + question.answer);

      return [this.createLabelParagraph(labels.answerLabel, answerLabel)];
    }

    if (question.format === GeneratedQuestionFormat.TRUE_FALSE) {
      if (!Array.isArray(question.answers)) {
        return [];
      }

      const paragraphs: FileChild[] = [
        new Paragraph({
          children: [this.createBoldRun(`${labels.answersLabel}: `)],
        }),
      ];

      for (const [index, answer] of question.answers.entries()) {
        const answerText = answer ? labels.trueLabel : labels.falseLabel;
        const choiceLetter = String.fromCharCode(97 + index);
        paragraphs.push(
          this.createLabelParagraph(`${choiceLetter})`, answerText),
        );
      }

      return paragraphs;
    }

    if (question.format === GeneratedQuestionFormat.ESSAY) {
      if (typeof question.answers !== 'string') {
        return [];
      }

      const sanitizedAnswers = this.sanitizeEquationDelimiters(
        question.answers,
      );
      const answerComponents = await this.renderMarkdown(sanitizedAnswers);

      return [
        new Paragraph({
          children: [this.createBoldRun(`${labels.answerLabel}: `)],
        }),
        ...answerComponents,
      ];
    }

    return [];
  }

  private createLabelParagraph(label: string, value: string): Paragraph {
    return new Paragraph({
      children: [
        this.createBoldRun(`${label}: `),
        new TextRun({
          text: value,
          font: 'Cambria Math',
        }),
      ],
    });
  }

  private createBoldRun(text: string): TextRun {
    return new TextRun({
      text,
      bold: true,
      font: 'Cambria Math',
    });
  }

  async convertDocxToMarkdown(
    file: Express.Multer.File,
    dto: ConvertDocxToMarkdownDto,
  ) {
    if (!file?.buffer?.length) {
      throw new BadRequestException('Uploaded DOCX file is empty.');
    }

    const normalizeLineEndings = dto.normalizeLineEndings ?? true;
    const stripTrailingWhitespace = dto.stripTrailingWhitespace ?? true;

    const tempDir = await fsPromises.mkdtemp(
      path.join(os.tmpdir(), 'docx-md-'),
    );
    const tempInputPath = path.join(tempDir, 'input.docx');

    try {
      await fsPromises.writeFile(tempInputPath, file.buffer);

      const markdown = await this.runMarkitdown(tempInputPath);
      const normalizedMarkdown = this.normalizeMarkdown(markdown, {
        normalizeLineEndings,
        stripTrailingWhitespace,
      });

      return {
        filename: file.originalname,
        markdown: normalizedMarkdown,
      };
    } finally {
      await fsPromises.rm(tempDir, { force: true, recursive: true });
    }
  }

  private async runMarkitdown(inputPath: string): Promise<string> {
    const markitdownPythonPath = this.configService.getOrThrow(
      'app.markitdownPythonBin',
      {
        infer: true,
      },
    );

    return new Promise((resolve, reject) => {
      const processRunner = spawn(
        markitdownPythonPath,
        ['-m', 'markitdown', inputPath],
        {
          cwd: path.dirname(inputPath),
          env: { ...process.env },
          shell: false,
        },
      );

      let stdout = '';
      let stderr = '';
      let didTimeout = false;

      const timer = setTimeout(() => {
        didTimeout = true;
        processRunner.kill('SIGKILL');
      }, MARKITDOWN_TIMEOUT_MS);

      processRunner.stdout.on('data', (data: Buffer) => {
        stdout += data.toString('utf8');
      });

      processRunner.stderr.on('data', (data: Buffer) => {
        stderr += data.toString('utf8');
      });

      processRunner.on('error', (error: NodeJS.ErrnoException) => {
        clearTimeout(timer);

        if (error.code === 'ENOENT') {
          reject(
            new InternalServerErrorException(
              `MarkItDown Python executable not found at ${markitdownPythonPath}.`,
            ),
          );
          return;
        }

        reject(
          new InternalServerErrorException(
            `Failed to start MarkItDown process: ${error.message}`,
          ),
        );
      });

      processRunner.on('close', (code) => {
        clearTimeout(timer);

        if (didTimeout) {
          reject(
            new RequestTimeoutException(
              'DOCX to Markdown conversion timed out.',
            ),
          );
          return;
        }

        if (code !== 0) {
          reject(
            new UnprocessableEntityException(
              stderr.trim() || `MarkItDown exited with code ${code}.`,
            ),
          );
          return;
        }

        resolve(stdout);
      });
    });
  }

  private normalizeMarkdown(
    markdown: string,
    options: {
      normalizeLineEndings: boolean;
      stripTrailingWhitespace: boolean;
    },
  ): string {
    let output = markdown;

    if (options.normalizeLineEndings) {
      output = output.replace(/\r\n/g, '\n');
    }

    if (options.stripTrailingWhitespace) {
      output = output
        .split('\n')
        .map((line) => line.replace(/[ \t]+$/g, ''))
        .join('\n');
    }

    return output;
  }

  private async renderMarkdown(markdown?: string): Promise<FileChild[]> {
    if (!markdown?.trim()) {
      return [];
    }

    const converter = new MarkdownDocx(markdown, {});

    return converter.toSection();
  }

  private sanitizeEquationDelimiters(content?: string): string | undefined {
    if (!content) {
      return content;
    }

    return content.replace(/\(\$/g, '( $').replace(/\$\)/g, '$ )');
  }

  private async createChoiceCell(
    content: string,
    index: number,
  ): Promise<TableCell> {
    const label = String.fromCharCode(65 + index);
    const sanitizedContent = this.sanitizeEquationDelimiters(content);
    const components = await this.renderMarkdown(sanitizedContent);
    if (components[0] instanceof Paragraph) {
      components[0].addRunToFront(
        new TextRun({
          text: `${label}. `,
          bold: true,
          font: 'Cambria Math',
        }),
      );
    }

    return new TableCell({
      children: components,
      width: {
        size: 50,
        type: WidthType.PERCENTAGE,
      },
      borders: DOCX_BORDER_NONE,
      verticalAlign: VerticalAlign.CENTER,
    });
  }

  private createEmptyCell(): TableCell {
    return new TableCell({
      children: [],
      width: { size: 50, type: WidthType.PERCENTAGE },
      borders: DOCX_BORDER_NONE,
      verticalAlign: VerticalAlign.CENTER,
    });
  }

  private buildFileName(title: string | undefined, count: number): string {
    const base =
      title
        ?.trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-') || `exercises-${count}`;
    const slug = base.replace(/^-+|-+$/g, '') || 'docx';
    const timestamp = Date.now();
    return `${slug}-${timestamp}.docx`;
  }
}
