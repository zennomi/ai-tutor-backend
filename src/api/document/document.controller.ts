import {
  BadRequestException,
  Body,
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import type { Express } from 'express';
import { DocumentService } from './document.service';
import { ConvertDocxToMarkdownDto } from './dto/convert-docx-to-markdown.dto';
import { GenerateDocxDto } from './dto/generate-docx.dto';

const allowedDocxMimeTypes = [
  'application/octet-stream',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

@ApiTags('documents')
@Controller({
  path: 'documents',
  version: '1',
})
export class DocumentController {
  constructor(private readonly documentService: DocumentService) {}

  @Post('docx/generate-test')
  async generateTest(@Body() body: GenerateDocxDto) {
    return this.documentService.generateDocx(body);
  }

  @Post('docx/to-markdown')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file'],
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'DOCX file to convert to Markdown.',
        },
        normalizeLineEndings: {
          type: 'boolean',
          example: true,
        },
        stripTrailingWhitespace: {
          type: 'boolean',
          example: true,
        },
      },
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: 50 * 1024 * 1024,
      },
      fileFilter: (_req, file, callback) => {
        const originalName = file.originalname || '';
        const hasDocxExtension = originalName.toLowerCase().endsWith('.docx');
        const hasAllowedMimeType = allowedDocxMimeTypes.includes(file.mimetype);

        if (!hasDocxExtension || !hasAllowedMimeType) {
          return callback(
            new BadRequestException(
              'Invalid file type. Only DOCX files are allowed.',
            ),
            false,
          );
        }

        callback(null, true);
      },
    }),
  )
  async convertDocxToMarkdown(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: ConvertDocxToMarkdownDto,
  ) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    return this.documentService.convertDocxToMarkdown(file, body);
  }
}
