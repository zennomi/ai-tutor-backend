import { IsNotEmpty, IsString, IsUrl, Matches } from 'class-validator';

export class UploadFileDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^[a-zA-Z0-9_\-/]+$/, {
    message:
      'Folder path can only contain letters, numbers, underscores, hyphens, and forward slashes',
  })
  folderPath: string;
}

export class DeleteFileDto {
  @IsString()
  @IsNotEmpty()
  @IsUrl({}, { message: 'fileUrl must be a valid URL' })
  fileUrl: string;
}
