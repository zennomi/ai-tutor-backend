import {
  ArrayMinSize,
  IsArray,
  IsOptional,
  Validate,
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

import {
  BooleanFieldOptional,
  ClassField,
  ClassFieldOptional,
  EnumField,
  EnumFieldOptional,
  NumberField,
  NumberFieldOptional,
  StringField,
  StringFieldOptional,
} from '@/decorators/field.decorators';

export enum GeneratedQuestionFormat {
  MULTIPLE_CHOICE = 'MULTIPLE_CHOICE',
  TRUE_FALSE = 'TRUE_FALSE',
  ESSAY = 'ESSAY',
}

export enum GenerateDocxLocale {
  VI = 'vi',
  EN = 'en',
}

@ValidatorConstraint({
  name: 'GeneratedQuestionByFormat',
  async: false,
})
class GeneratedQuestionByFormat implements ValidatorConstraintInterface {
  validate(_value: unknown, args: ValidationArguments): boolean {
    const question = args.object as GeneratedQuestionDto;

    switch (question.format) {
      case GeneratedQuestionFormat.MULTIPLE_CHOICE:
        return (
          Array.isArray(question.choices) &&
          question.choices.length >= 2 &&
          Number.isInteger(question.answer) &&
          Number(question.answer) >= 0 &&
          Number(question.answer) < question.choices.length
        );

      case GeneratedQuestionFormat.TRUE_FALSE:
        return (
          Array.isArray(question.statements) &&
          question.statements.length >= 1 &&
          Array.isArray(question.answers) &&
          question.answers.length >= 1 &&
          question.answers.length === question.statements.length &&
          question.answers.every((answer) => typeof answer === 'boolean')
        );

      case GeneratedQuestionFormat.ESSAY:
        return (
          typeof question.answers === 'string' &&
          question.answers.trim().length > 0
        );

      default:
        return true;
    }
  }

  defaultMessage(args: ValidationArguments): string {
    const question = args.object as GeneratedQuestionDto;

    switch (question.format) {
      case GeneratedQuestionFormat.MULTIPLE_CHOICE:
        return 'MULTIPLE_CHOICE questions require choices (min 2) and answer index within choices range';
      case GeneratedQuestionFormat.TRUE_FALSE:
        return 'TRUE_FALSE questions require statements and boolean answers with equal non-empty lengths';
      case GeneratedQuestionFormat.ESSAY:
        return 'ESSAY questions require answers as a non-empty string';
      default:
        return 'Invalid question format payload';
    }
  }
}

export class GenerateDocxOptionsDto {
  @BooleanFieldOptional({
    default: true,
    example: true,
  })
  includeSolutions?: boolean;

  @BooleanFieldOptional({
    default: false,
    example: false,
  })
  shuffleQuestions?: boolean;

  @BooleanFieldOptional({
    default: false,
    example: false,
  })
  shuffleChoices?: boolean;
}

export class GenerateDocxSourceDto {
  @StringFieldOptional({
    maxLength: 255,
    example: 'de-kiem-tra-chuong-dien.docx',
  })
  filename?: string;

  @StringFieldOptional({
    example: '# Nguồn đề kiểm tra',
  })
  markdown?: string;
}

export class GeneratedQuestionDto {
  @EnumField(() => GeneratedQuestionFormat, {
    example: GeneratedQuestionFormat.MULTIPLE_CHOICE,
  })
  @Validate(GeneratedQuestionByFormat)
  format: GeneratedQuestionFormat;

  @StringField({
    maxLength: 2000,
    example:
      'Chỉ ra công thức **đúng** của định luật Cu−lông trong chân không.',
  })
  question: string;

  @NumberField({
    int: true,
    isPositive: true,
    example: 12,
  })
  grade: number;

  @StringField({
    maxLength: 255,
    example: 'Vật lí 11',
  })
  textbook: string;

  @StringField({
    maxLength: 255,
    example: 'Điện tích và điện trường',
  })
  unit: string;

  @StringField({
    maxLength: 255,
    example: 'Định luật Cu-lông',
  })
  lesson: string;

  @StringField({
    maxLength: 255,
    example: 'Trắc nghiệm',
  })
  type: string;

  @StringFieldOptional({
    minLength: 1,
    example:
      'Trong chân không, lực tương tác giữa hai điện tích điểm tỉ lệ thuận với tích độ lớn của hai điện tích và tỉ lệ nghịch với bình phương khoảng cách giữa chúng.',
  })
  solution?: string;

  @IsOptional()
  @IsArray()
  @ArrayMinSize(2)
  @StringFieldOptional({
    each: true,
    example: [
      '$F=k\\frac{\\left|q_{1}q_{2}\\right|}{r^{2}}.$',
      '$F=k\\frac{\\left|q_{1}q_{2}\\right|}{r}.$',
      '$F=k\\frac{q_{1}q_{2}}{r^{2}}.$',
      '$F=k\\frac{q_{1}q_{2}}{r}.$',
    ],
  })
  choices?: string[];

  @NumberFieldOptional({
    int: true,
    min: 0,
    example: 0,
  })
  answer?: number;

  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @StringFieldOptional({
    each: true,
    example: [
      'Điện tích cùng dấu thì đẩy nhau',
      'Điện tích trái dấu thì hút nhau',
    ],
  })
  statements?: string[];

  @IsOptional()
  answers?: string | boolean[];
}

export class GenerateDocxDto {
  @StringFieldOptional({
    maxLength: 255,
    example: 'Đề kiểm tra Chương Điện tích và Điện trường',
  })
  title?: string;

  @EnumFieldOptional(() => GenerateDocxLocale, {
    default: GenerateDocxLocale.VI,
    example: GenerateDocxLocale.VI,
  })
  locale?: GenerateDocxLocale;

  @IsArray()
  @ArrayMinSize(1)
  @ClassField(() => GeneratedQuestionDto, {
    each: true,
    isArray: true,
  })
  questions: GeneratedQuestionDto[];

  @ClassFieldOptional(() => GenerateDocxOptionsDto)
  options?: GenerateDocxOptionsDto;

  @ClassFieldOptional(() => GenerateDocxSourceDto)
  source?: GenerateDocxSourceDto;
}
