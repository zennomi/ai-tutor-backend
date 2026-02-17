import {
  ClassField,
  StringField,
  UUIDField,
} from '@/decorators/field.decorators';
import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class CurriculumTreeTypeResDto {
  @UUIDField()
  @Expose()
  uuid: string;

  @StringField()
  @Expose()
  name: string;
}

@Exclude()
export class CurriculumTreeLessonResDto {
  @UUIDField()
  @Expose()
  uuid: string;

  @StringField()
  @Expose()
  name: string;

  @ClassField(() => CurriculumTreeTypeResDto, { each: true, isArray: true })
  @Expose()
  types: CurriculumTreeTypeResDto[];
}

@Exclude()
export class CurriculumTreeUnitResDto {
  @UUIDField()
  @Expose()
  uuid: string;

  @StringField()
  @Expose()
  name: string;

  @ClassField(() => CurriculumTreeLessonResDto, { each: true, isArray: true })
  @Expose()
  lessons: CurriculumTreeLessonResDto[];
}

@Exclude()
export class CurriculumTreeTextbookResDto {
  @UUIDField()
  @Expose()
  uuid: string;

  @StringField()
  @Expose()
  name: string;

  @ClassField(() => CurriculumTreeUnitResDto, { each: true, isArray: true })
  @Expose()
  units: CurriculumTreeUnitResDto[];
}

@Exclude()
export class CurriculumTreeGradeResDto {
  @UUIDField()
  @Expose()
  uuid: string;

  @StringField()
  @Expose()
  name: string;

  @ClassField(() => CurriculumTreeTextbookResDto, { each: true, isArray: true })
  @Expose()
  textbooks: CurriculumTreeTextbookResDto[];
}
