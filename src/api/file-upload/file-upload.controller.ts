import { ApiAuth } from '@/decorators/http.decorators';
import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { DeleteFileDto, UploadFileDto } from './dto/upload-file.dto';
import { FileUploadService } from './file-upload.service';

@ApiTags('File Upload')
@Controller({
  path: 'files',
  version: '1',
})
export class FileUploadController {
  constructor(private readonly fileUploadService: FileUploadService) {}

  @Post('upload')
  @ApiOperation({ summary: 'Upload a file (.ai, .dxf, .png, .jpeg)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file', 'folderPath'],
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'File to upload (.ai, .dxf, .png, .jpeg)',
        },
        folderPath: {
          type: 'string',
          description:
            'Folder path where the file will be stored (e.g., "orders/123/designs")',
          example: 'orders/123/designs',
        },
      },
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: 50 * 1024 * 1024, // 50MB limit
      },
      fileFilter: (req, file, callback) => {
        // Check file extension
        const allowedExtensions = ['.ai', '.dxf', '.png', '.jpeg', '.jpg'];
        const ext = file.originalname
          .substring(file.originalname.lastIndexOf('.'))
          .toLowerCase();

        if (!allowedExtensions.includes(ext)) {
          return callback(
            new BadRequestException(
              `Invalid file type. Allowed: ${allowedExtensions.join(', ')}`,
            ),
            false,
          );
        }

        callback(null, true);
      },
    }),
  )
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: UploadFileDto,
  ) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    return this.fileUploadService.uploadFile(file, dto.folderPath);
  }

  @Delete()
  @ApiAuth()
  @ApiOperation({ summary: 'Delete a file by URL' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['fileUrl'],
      properties: {
        fileUrl: {
          type: 'string',
          description:
            'Full URL of the file to delete (e.g., "http://localhost:3000/uploads/orders/123/designs/filename.png")',
          example:
            'http://localhost:3000/uploads/orders/123/designs/filename.png',
        },
      },
    },
  })
  async deleteFile(@Body() dto: DeleteFileDto) {
    await this.fileUploadService.deleteFileByUrl(dto.fileUrl);
    return { message: 'File deleted successfully' };
  }
}
