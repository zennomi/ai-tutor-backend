import { UUIDField } from '@/decorators/field.decorators';
import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class ExerciseResDto {
  @UUIDField()
  @Expose()
  id: string;

  @UUIDField()
  @Expose()
  lessonId: string;

  @UUIDField()
  @Expose()
  formatId: string;

  @UUIDField({ required: false, nullable: true })
  @Expose()
  typeId: string | null;

  @Expose()
  question: string;

  @Expose()
  solution: string;

  @Expose()
  key: string;

  @Expose()
  hasImage: boolean;
}
