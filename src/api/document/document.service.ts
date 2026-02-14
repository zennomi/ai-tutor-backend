import { FileStorageService } from '@/libs/file-storage/file-storage.service';
import { Injectable } from '@nestjs/common';
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
import * as fs from 'fs';
import { MarkdownDocx } from 'markdown-docx';
import * as path from 'path';
import { GenerateDocxDto } from './dto/generate-docx.dto';

@Injectable()
export class DocumentService {
  private readonly borderNone = {
    top: { style: BorderStyle.NONE, size: 0, color: 'auto' },
    bottom: { style: BorderStyle.NONE, size: 0, color: 'auto' },
    left: { style: BorderStyle.NONE, size: 0, color: 'auto' },
    right: { style: BorderStyle.NONE, size: 0, color: 'auto' },
  };

  constructor(private readonly fileStorageService: FileStorageService) {}

  async generateDocx({ title, exercises }: GenerateDocxDto) {
    const paragraphs: FileChild[] = [];

    const titleParagraph = new Paragraph({
      children: [
        new TextRun({
          text: title || 'Bài kiểm tra',
          font: 'Cambria Math',
          bold: true,
        }),
      ],
      alignment: AlignmentType.CENTER,
    });

    const questionParagraphs: FileChild[] = [];
    const solutionParagraphs: FileChild[] = [];

    for (const [index, exercise] of exercises.entries()) {
      // --- Questions Section ---
      const sanitizedQuestion = this.sanitizeEquationDelimiters(
        exercise.question,
      );
      const questionComponents = await this.renderMarkdown(sanitizedQuestion);

      if (questionComponents[0] instanceof Paragraph) {
        questionComponents[0].addRunToFront(
          new TextRun({
            text: `Câu ${index + 1}: `,
            bold: true,
            font: 'Cambria Math',
          }),
        );
      }
      questionParagraphs.push(...questionComponents);
      if (exercise.choices?.length) {
        const rows: TableRow[] = [];
        for (let i = 0; i < exercise.choices.length; i += 2) {
          const cells: TableCell[] = [];

          cells.push(await this.createChoiceCell(exercise.choices[i], i));

          if (i + 1 < exercise.choices.length) {
            cells.push(
              await this.createChoiceCell(exercise.choices[i + 1], i + 1),
            );
          } else {
            // Empty cell for alignment
            cells.push(this.createEmptyCell());
          }

          rows.push(new TableRow({ children: cells }));
        }

        questionParagraphs.push(
          new Table({
            rows: rows,
            width: {
              size: 100,
              type: WidthType.PERCENTAGE,
            },
            borders: {
              ...this.borderNone,
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
          }),
        );
      }

      // --- Solutions Section ---
      if (exercise.key || exercise.solution) {
        solutionParagraphs.push(
          new Paragraph({
            children: [
              new TextRun({
                text: `Câu ${index + 1}: `,
                bold: true,
                font: 'Cambria Math',
              }),
            ],
          }),
        );

        if (exercise.key) {
          const sanitizedKey = this.sanitizeEquationDelimiters(exercise.key);
          solutionParagraphs.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: 'Đáp án: ',
                  bold: true,
                  font: 'Cambria Math',
                }),
                new TextRun({ text: sanitizedKey, font: 'Cambria Math' }),
              ],
            }),
          );
        }

        if (exercise.solution) {
          const sanitizedSolution = this.sanitizeEquationDelimiters(
            exercise.solution,
          );
          const solutionComponents =
            await this.renderMarkdown(sanitizedSolution);
          solutionParagraphs.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: 'Lời giải chi tiết: ',
                  bold: true,
                  font: 'Cambria Math',
                }),
              ],
            }),
          );
          solutionParagraphs.push(...solutionComponents);
        }

        solutionParagraphs.push(new Paragraph({}));
      }
    }

    paragraphs.push(...questionParagraphs);

    if (solutionParagraphs.length > 0) {
      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: 'ĐÁP ÁN VÀ LỜI GIẢI CHI TIẾT',
              bold: true,
              font: 'Cambria Math',
              size: 28, // 14pt
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
    const filename = this.buildFileName(title, exercises.length);
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
      borders: this.borderNone,
      verticalAlign: VerticalAlign.CENTER,
    });
  }

  private createEmptyCell(): TableCell {
    return new TableCell({
      children: [],
      width: { size: 50, type: WidthType.PERCENTAGE },
      borders: this.borderNone,
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
