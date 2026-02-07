import {
  ClassField,
  NumberField,
  StringField,
  StringFieldOptional,
} from '@/decorators/field.decorators';
import { ArrayMinSize, IsArray } from 'class-validator';

class ExerciseDto {
  @NumberField({ int: true, example: 1 })
  type: number;

  @StringField({
    maxLength: 2000,
    example:
      'Chỉ ra công thức **đúng** của định luật Cu−lông trong chân không.',
  })
  question: string;

  @StringFieldOptional({
    each: true,
    example: [
      '$F=k\\frac{\\left|q_{1}q_{2}\\right|}{r^{2}}.$',
      '$F=k\\frac{\\left|q_{1}q_{2}\\right|}{r}.$',
      '$F=k\\frac{q_{1}q_{2}}{r^{2}}.$',
      '$F=k\\frac{q_{1}q_{2}}{r}.$',
    ],
  })
  @ArrayMinSize(1)
  choices?: string[];

  @StringFieldOptional({ minLength: 1, maxLength: 5, example: 'A' })
  key?: string;

  @StringFieldOptional({
    minLength: 1,
    example:
      'Trong chân không, lực tương tác giữa hai điện tích điểm tỉ lệ thuận với tích độ lớn của hai điện tích và tỉ lệ nghịch với bình phương khoảng cách giữa chúng.',
  })
  solution?: string;
}

export class GenerateDocxDto {
  @StringFieldOptional({
    maxLength: 255,
    example: 'Đề kiểm tra Chương Điện tích và Điện trường',
  })
  title?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ClassField(() => ExerciseDto, { each: true, isArray: true })
  exercises: ExerciseDto[];
}
