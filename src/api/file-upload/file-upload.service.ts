import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { FileStorageService } from '../../libs/file-storage/file-storage.service';

// Allowed file extensions
const ALLOWED_EXTENSIONS = ['.ai', '.dxf', '.png', '.jpeg', '.jpg'];
const ALLOWED_MIME_TYPES = [
  'application/postscript', // .ai
  'application/illustrator', // .ai alternative
  'image/vnd.dxf', // .dxf
  'application/dxf', // .dxf alternative
  'application/octet-stream', // generic binary (for .ai, .dxf)
  'image/png', // .png
  'image/jpeg', // .jpeg, .jpg
];

@Injectable()
export class FileUploadService {
  private readonly logger = new Logger(FileUploadService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly fileStorageService: FileStorageService,
  ) {}

  /**
   * Validate file extension
   */
  private validateFileExtension(filename: string): string {
    const ext = path.extname(filename).toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      throw new BadRequestException(
        `Invalid file extension. Allowed extensions: ${ALLOWED_EXTENSIONS.join(', ')}`,
      );
    }
    return ext;
  }

  /**
   * Sanitize folder path to prevent directory traversal attacks
   */
  private sanitizeFolderPath(folderPath: string): string {
    // Remove leading/trailing slashes and normalize path
    const sanitized = folderPath
      .replace(/^\/+|\/+$/g, '')
      .replace(/\.{2,}/g, '') // Remove any .. sequences
      .replace(/\/+/g, '/'); // Replace multiple slashes with single

    // Additional check for path traversal
    if (sanitized.includes('..')) {
      throw new BadRequestException('Invalid folder path');
    }

    return sanitized;
  }

  /**
   * Upload a file to the specified folder
   */
  async uploadFile(
    file: Express.Multer.File,
    folderPath: string,
  ): Promise<{ url: string; filename: string; path: string }> {
    // Validate file
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    // Validate extension
    const ext = this.validateFileExtension(file.originalname);

    // Sanitize folder path
    const sanitizedFolder = this.sanitizeFolderPath(folderPath);

    // Generate unique filename
    const name = path.parse(file.originalname).name;
    const safeName = name.replace(/[^a-zA-Z0-9-]/g, '-');
    const uniqueFilename = `${safeName}-${uuidv4()}-${Date.now()}${ext}`;

    // Upload file using FileStorageService
    const url = await this.fileStorageService.saveFile(
      file.buffer,
      uniqueFilename,
      sanitizedFolder,
    );

    const relativePath = `/uploads/${sanitizedFolder}/${uniqueFilename}`;

    return {
      url,
      filename: uniqueFilename,
      path: relativePath,
    };
  }

  /**
   * Delete a file by its full URL
   */
  async deleteFileByUrl(fileUrl: string): Promise<void> {
    try {
      const url = new URL(fileUrl);
      const filePath = url.pathname; // Extract path from URL (e.g., "/uploads/orders/123/file.png")
      await this.deleteFile(filePath);
    } catch (error) {
      if (error instanceof TypeError) {
        throw new BadRequestException('Invalid URL format');
      }
      throw error;
    }
  }

  /**
   * Delete a file by its relative path
   */
  async deleteFile(filePath: string): Promise<void> {
    // Sanitize the path
    const sanitizedPath = filePath.replace(/^\//, '');

    // Ensure the path starts with 'uploads/'
    if (!sanitizedPath.startsWith('uploads/')) {
      throw new BadRequestException(
        'Invalid file path. Path must be within uploads directory.',
      );
    }

    // Check for path traversal
    if (sanitizedPath.includes('..')) {
      throw new BadRequestException('Invalid file path');
    }

    // Delegate deletion to FileStorageService
    // It expects a URL path (relative to root, e.g. /uploads/...)
    // sanitizedPath is 'uploads/...'
    await this.fileStorageService.deleteFile(sanitizedPath);
  }

  /**
   * Get allowed extensions for documentation
   */
  getAllowedExtensions(): string[] {
    return ALLOWED_EXTENSIONS;
  }

  /**
   * Get allowed MIME types for documentation
   */
  getAllowedMimeTypes(): string[] {
    return ALLOWED_MIME_TYPES;
  }
}
