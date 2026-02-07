import { FileStorageService } from '@/libs/file-storage/file-storage.service';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DocxExportController } from './docx-export.controller';
import { DocxExportService } from './docx-export.service';

@Module({
  imports: [ConfigModule],
  controllers: [DocxExportController],
  providers: [DocxExportService, FileStorageService],
})
export class DocxExportModule {}
