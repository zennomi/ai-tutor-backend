import { PageOptionsDto } from '@/common/dto/offset-pagination/page-options.dto';
import {
  StringFieldOptional,
  UUIDFieldOptional,
} from '@/decorators/field.decorators';
import { Transform } from 'class-transformer';

function toStringArray(value: unknown): string[] | undefined {
  if (Array.isArray(value)) {
    return value;
  }

  if (typeof value === 'string') {
    return [value];
  }

  return undefined;
}

export class ListExerciseReqDto extends PageOptionsDto {
  @StringFieldOptional({ minLength: 1, maxLength: 2000 })
  readonly search?: string;

  @Transform(({ value }) => toStringArray(value))
  @UUIDFieldOptional({ each: true })
  readonly lessonIds?: string[];

  @Transform(({ value }) => toStringArray(value))
  @UUIDFieldOptional({ each: true })
  readonly typeIds?: string[];

  @Transform(({ value }) => toStringArray(value))
  @UUIDFieldOptional({ each: true })
  readonly formatIds?: string[];

  @Transform(({ value }) => toStringArray(value))
  @UUIDFieldOptional({ each: true })
  readonly gradeIds?: string[];

  @Transform(({ value }) => toStringArray(value))
  @UUIDFieldOptional({ each: true })
  readonly textbookIds?: string[];

  @Transform(({ value }) => toStringArray(value))
  @UUIDFieldOptional({ each: true })
  readonly unitIds?: string[];
}
