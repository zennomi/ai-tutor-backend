import { FileStorageService } from '@/libs/file-storage/file-storage.service';
import { Injectable } from '@nestjs/common';
import {
  BorderStyle,
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from 'docx';
import * as path from 'path';
import { GenerateDocxDto } from './dto/generate-docx.dto';

@Injectable()
export class DocxExportService {
  constructor(private readonly fileStorageService: FileStorageService) {}

  async generateDocx({ title, exercises }: GenerateDocxDto) {
    const paragraphs: (Paragraph | Table)[] = [];

    if (title) {
      paragraphs.push(
        new Paragraph({
          text: title,
          heading: HeadingLevel.HEADING_1,
        }),
      );
    }

    exercises.forEach((exercise, index) => {
      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({ text: `Câu ${index + 1}: `, bold: true }),
            new TextRun(exercise.question),
          ],
        }),
      );

      if (exercise.choices?.length) {
        const rows: TableRow[] = [];
        for (let i = 0; i < exercise.choices.length; i += 2) {
          const cells: TableCell[] = [];

          // Helper to create cell
          const createCell = (text: string, index: number) => {
            const label = String.fromCharCode(65 + index);
            return new TableCell({
              children: [
                new Paragraph({
                  children: [
                    new TextRun({ text: `${label}. `, bold: true }),
                    new TextRun(text),
                  ],
                }),
              ],
              width: {
                size: 50,
                type: WidthType.PERCENTAGE,
              },
              borders: {
                top: { style: BorderStyle.NONE, size: 0, color: 'auto' },
                bottom: { style: BorderStyle.NONE, size: 0, color: 'auto' },
                left: { style: BorderStyle.NONE, size: 0, color: 'auto' },
                right: { style: BorderStyle.NONE, size: 0, color: 'auto' },
              },
            });
          };

          cells.push(createCell(exercise.choices[i], i));

          if (i + 1 < exercise.choices.length) {
            cells.push(createCell(exercise.choices[i + 1], i + 1));
          } else {
            // Empty cell for alignment
            cells.push(
              new TableCell({
                children: [],
                width: { size: 50, type: WidthType.PERCENTAGE },
                borders: {
                  top: { style: BorderStyle.NONE, size: 0, color: 'auto' },
                  bottom: { style: BorderStyle.NONE, size: 0, color: 'auto' },
                  left: { style: BorderStyle.NONE, size: 0, color: 'auto' },
                  right: { style: BorderStyle.NONE, size: 0, color: 'auto' },
                },
              }),
            );
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
              top: { style: BorderStyle.NONE, size: 0, color: 'auto' },
              bottom: { style: BorderStyle.NONE, size: 0, color: 'auto' },
              left: { style: BorderStyle.NONE, size: 0, color: 'auto' },
              right: { style: BorderStyle.NONE, size: 0, color: 'auto' },
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
        paragraphs.push(
          new Paragraph({
            children: [
              new TextRun({ text: 'Lời giải chi tiết: ', bold: true }),
              new TextRun(exercise.solution),
            ],
          }),
        );
      }

      paragraphs.push(new Paragraph({}));
    });

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
