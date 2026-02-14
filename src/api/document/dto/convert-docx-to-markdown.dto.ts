import { BooleanFieldOptional } from '@/decorators/field.decorators';

export class ConvertDocxToMarkdownDto {
  @BooleanFieldOptional({
    default: true,
    description: 'Normalize line endings to LF.',
    example: true,
  })
  normalizeLineEndings?: boolean;

  @BooleanFieldOptional({
    default: true,
    description: 'Strip trailing whitespace from each line.',
    example: true,
  })
  stripTrailingWhitespace?: boolean;
}
