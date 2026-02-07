import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CurriculumExerciseImportController } from './controllers/curriculum-exercise-import.controller';
import { CurriculumMergeController } from './controllers/curriculum-merge.controller';
import { ExerciseTypeEntity } from './entities/exercise-type.entity';
import { ExerciseEntity } from './entities/exercise.entity';
import { FormatEntity } from './entities/format.entity';
import { GradeEntity } from './entities/grade.entity';
import { LessonEntity } from './entities/lesson.entity';
import { TextbookEntity } from './entities/textbook.entity';
import { UnitEntity } from './entities/unit.entity';
import { CurriculumExerciseImportService } from './services/curriculum-exercise-import.service';
import { CurriculumMergeService } from './services/curriculum-merge.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      GradeEntity,
      TextbookEntity,
      UnitEntity,
      LessonEntity,
      FormatEntity,
      ExerciseTypeEntity,
      ExerciseEntity,
    ]),
  ],
  controllers: [CurriculumExerciseImportController, CurriculumMergeController],
  providers: [CurriculumExerciseImportService, CurriculumMergeService],
  exports: [TypeOrmModule],
})
export class CurriculumModule {}
