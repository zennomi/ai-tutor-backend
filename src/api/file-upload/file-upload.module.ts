import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { FileStorageModule } from '../../libs/file-storage/file-storage.module';
import { FileUploadController } from './file-upload.controller';
import { FileUploadService } from './file-upload.service';

@Module({
  imports: [
    MulterModule.register({
      // Use memory storage - we'll handle file writing manually
    }),
    FileStorageModule,
  ],
  controllers: [FileUploadController],
  providers: [FileUploadService],
  exports: [FileUploadService],
})
export class FileUploadModule {}
