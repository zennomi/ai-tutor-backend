import { Expose } from 'class-transformer';

export class SearchExercisesResDto {
  @Expose()
  id: string;

  @Expose()
  textbook: string;

  @Expose()
  unit: string;

  @Expose()
  lesson: string;

  @Expose()
  type: string;

  @Expose()
  format: string;

  @Expose()
  grade: string;

  @Expose()
  question: string;

  @Expose()
  hasImage: boolean;

  @Expose()
  key: string;

  @Expose()
  solution: string;

  @Expose()
  distance?: number;
}
