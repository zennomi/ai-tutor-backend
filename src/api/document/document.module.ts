import { FileStorageService } from '@/libs/file-storage/file-storage.service';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DocumentController } from './document.controller';
import { DocumentService } from './document.service';

@Module({
  imports: [ConfigModule],
  controllers: [DocumentController],
  providers: [DocumentService, FileStorageService],
})
export class DocumentModule {}
