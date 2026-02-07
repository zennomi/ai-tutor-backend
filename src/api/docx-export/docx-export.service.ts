import { FileStorageService } from '@/libs/file-storage/file-storage.service';
import { Injectable } from '@nestjs/common';
import {
  BorderStyle,
  Document,
  FileChild,
  HeadingLevel,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  VerticalAlign,
  WidthType,
} from 'docx';
import { MarkdownDocx } from 'markdown-docx';
import * as path from 'path';
import { GenerateDocxDto } from './dto/generate-docx.dto';

@Injectable()
export class DocxExportService {
  private readonly borderNone = {
    top: { style: BorderStyle.NONE, size: 0, color: 'auto' },
    bottom: { style: BorderStyle.NONE, size: 0, color: 'auto' },
    left: { style: BorderStyle.NONE, size: 0, color: 'auto' },
    right: { style: BorderStyle.NONE, size: 0, color: 'auto' },
  };

  constructor(private readonly fileStorageService: FileStorageService) {}

  async generateDocx({ title, exercises }: GenerateDocxDto) {
    const paragraphs: FileChild[] = [];

    if (title) {
      paragraphs.push(
        new Paragraph({
          text: title,
          heading: HeadingLevel.HEADING_1,
        }),
      );
    }

    for (const [index, exercise] of exercises.entries()) {
      const questionComponents = await this.renderMarkdown(exercise.question);

      const firstComponent = questionComponents.shift();
      if (firstComponent instanceof Paragraph) {
        paragraphs.push(
          new Paragraph({
            children: [
              new TextRun({ text: `Câu ${index + 1}: `, bold: true }),
              firstComponent,
            ],
          }),
        );
        paragraphs.push(...questionComponents);
      } else {
        paragraphs.push(
          new Paragraph({
            children: [new TextRun({ text: `Câu ${index + 1}: `, bold: true })],
          }),
        );
        paragraphs.push(firstComponent);
        paragraphs.push(...questionComponents);
      }

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

        paragraphs.push(
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

      if (exercise.key) {
        paragraphs.push(
          new Paragraph({
            children: [
              new TextRun({ text: 'Đáp án: ', bold: true }),
              new TextRun(exercise.key),
            ],
          }),
        );
      }

      if (exercise.solution) {
        const solutionComponents = await this.renderMarkdown(exercise.solution);
        paragraphs.push(
          new Paragraph({
            children: [
              new TextRun({ text: 'Lời giải chi tiết: ', bold: true }),
            ],
          }),
        );
        paragraphs.push(...solutionComponents);
      }

      paragraphs.push(new Paragraph({}));
    }

    const doc = new Document({
      sections: [
        {
          children: paragraphs,
        },
      ],
    });

    const buffer = await Packer.toBuffer(doc);
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

    const converter = new MarkdownDocx(markdown, {
      ignoreImage: true,
    });

    return converter.toSection();
  }

  private async createChoiceCell(
    content: string,
    index: number,
  ): Promise<TableCell> {
    const label = String.fromCharCode(65 + index);
    const components = await this.renderMarkdown(content);
    const firstComponent = components.shift();
    const children: FileChild[] = [];
    if (firstComponent instanceof Paragraph) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: `${label}. `, bold: true }),
            firstComponent,
          ],
          spacing: { after: 0 },
        }),
        ...components,
      );
    } else {
      children.push(
        new Paragraph({
          children: [new TextRun({ text: `${label}. `, bold: true })],
          spacing: { after: 0 },
        }),
        firstComponent,
        ...components,
      );
    }

    return new TableCell({
      children,
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
