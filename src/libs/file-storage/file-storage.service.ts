import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class FileStorageService {
  private readonly logger = new Logger(FileStorageService.name);
  private readonly uploadPath: string;
  private readonly rendersPath: string;
  private readonly appUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.uploadPath =
      this.configService.get<string>('UPLOAD_PATH') || './uploads';
    this.rendersPath = path.join(this.uploadPath, 'renders');
    this.appUrl =
      this.configService.get<string>('app.url') || 'http://localhost:3000';

    // Ensure directories exist
    this.ensureDirectoryExists(this.uploadPath);
    this.ensureDirectoryExists(this.rendersPath);
  }

  private ensureDirectoryExists(dirPath: string): void {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
      this.logger.log(`Created directory: ${dirPath}`);
    }
  }

  /**
   * Save image buffer to file system
   * @param imageBuffer - Buffer containing image data
   * @param mimeType - MIME type of the image (e.g., 'image/png')
   * @returns Full URL to the saved file
   */
  async saveImage(
    imageBuffer: Buffer,
    mimeType: string,
    fileName?: string,
  ): Promise<string> {
    const extension = this.getExtensionFromMimeType(mimeType);
    let filename: string;

    if (fileName) {
      const name = path.parse(fileName).name;
      // Remove special characters and spaces for safety
      const safeName = name.replace(/[^a-zA-Z0-9-]/g, '-');
      filename = `${safeName}-${uuidv4()}${extension}`;
    } else {
      filename = `${uuidv4()}-${Date.now()}${extension}`;
    }

    return this.saveFile(imageBuffer, filename, 'renders');
  }

  /**
   * Save generic file to file system
   * @param buffer - Buffer containing file data
   * @param fileName - Destination filename
   * @param subFolder - Subfolder within uploads directory
   * @returns Full URL to the saved file
   */
  async saveFile(
    buffer: Buffer,
    fileName: string,
    subFolder: string = '',
  ): Promise<string> {
    const targetDir = path.join(this.uploadPath, subFolder);
    this.ensureDirectoryExists(targetDir);

    const filePath = path.join(targetDir, fileName);

    await fs.promises.writeFile(filePath, buffer);
    this.logger.log(`Saved file: ${fileName} to ${targetDir}`);

    // Return full URL
    // Ensure subFolder is handled correctly in URL
    const urlPath = subFolder ? path.posix.join(subFolder, fileName) : fileName;
    const relativePath = `/uploads/${urlPath}`;
    return `${this.appUrl}${relativePath}`;
  }

  /**
   * Save base64 encoded image
   * @param base64Data - Base64 encoded image data (without data URL prefix)
   * @param mimeType - MIME type of the image
   * @returns Full URL to the saved file
   */
  async saveBase64Image(
    base64Data: string,
    mimeType: string,
    fileName?: string,
  ): Promise<string> {
    const imageBuffer = Buffer.from(base64Data, 'base64');
    return this.saveImage(imageBuffer, mimeType, fileName);
  }

  /**
   * Delete file by URL path
   * @param urlPath - Relative URL path (e.g., '/uploads/renders/render-uuid.png')
   */
  async deleteFile(urlPath: string): Promise<void> {
    try {
      // Convert URL path to file system path
      const relativePath = urlPath.replace(/^\//, '');
      const filePath = path.join(process.cwd(), relativePath);

      if (fs.existsSync(filePath)) {
        await fs.promises.unlink(filePath);
        this.logger.log(`Deleted file: ${filePath}`);
      } else {
        this.logger.warn(`File not found for deletion: ${filePath}`);
      }
    } catch (error) {
      this.logger.error(`Error deleting file: ${urlPath}`, error);
      throw error;
    }
  }

  /**
   * Get file extension from MIME type
   */
  private getExtensionFromMimeType(mimeType: string): string {
    const mimeToExtension: Record<string, string> = {
      'image/png': '.png',
      'image/jpeg': '.jpg',
      'image/jpg': '.jpg',
      'image/gif': '.gif',
      'image/webp': '.webp',
    };

    return mimeToExtension[mimeType] || '.png';
  }

  /**
   * Get the full file system path for an upload
   */
  getFullPath(relativePath: string): string {
    return path.join(process.cwd(), relativePath.replace(/^\//, ''));
  }

  /**
   * Check if a file exists
   */
  fileExists(urlPath: string): boolean {
    const fullPath = this.getFullPath(urlPath);
    return fs.existsSync(fullPath);
  }
}
