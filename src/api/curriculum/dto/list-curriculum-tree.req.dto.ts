import { UUIDFieldOptional } from '@/decorators/field.decorators';
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

export class ListCurriculumTreeReqDto {
  @Transform(({ value }) => toStringArray(value))
  @UUIDFieldOptional({ each: true })
  readonly gradeIds?: string[];
}
