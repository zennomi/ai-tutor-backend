import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

export class BulkExerciseImportItemDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  grade!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  textbook!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  unit!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  lesson!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  format!: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  type?: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  question!: string;

  @ApiProperty()
  @IsString()
  solution!: string;

  @ApiProperty()
  @IsString()
  key!: string;

  @ApiProperty({ name: 'has_image', type: Boolean })
  @Expose({ name: 'has_image' })
  @IsBoolean()
  hasImage!: boolean;
}

export class BulkExerciseImportDto {
  @ApiProperty({ type: [BulkExerciseImportItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => BulkExerciseImportItemDto)
  items!: BulkExerciseImportItemDto[];
}
