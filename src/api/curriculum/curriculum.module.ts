import { EmbeddingModule } from '@/libs/embedding/embedding.module';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CurriculumEmbeddingController } from './controllers/curriculum-embedding.controller';
import { CurriculumExerciseImportController } from './controllers/curriculum-exercise-import.controller';
import { CurriculumExerciseController } from './controllers/curriculum-exercise.controller';
import { CurriculumMergeController } from './controllers/curriculum-merge.controller';
import { CurriculumTreeController } from './controllers/curriculum-tree.controller';
import { ExerciseTypeEntity } from './entities/exercise-type.entity';
import { ExerciseEntity } from './entities/exercise.entity';
import { FormatEntity } from './entities/format.entity';
import { GradeEntity } from './entities/grade.entity';
import { LessonEntity } from './entities/lesson.entity';
import { TextbookEntity } from './entities/textbook.entity';
import { UnitEntity } from './entities/unit.entity';
import { CurriculumExerciseEmbeddingBackfillService } from './services/curriculum-exercise-embedding-backfill.service';
import { CurriculumExerciseImportService } from './services/curriculum-exercise-import.service';
import { CurriculumExerciseService } from './services/curriculum-exercise.service';
import { CurriculumMergeService } from './services/curriculum-merge.service';
import { CurriculumTreeService } from './services/curriculum-tree.service';

@Module({
  imports: [
    EmbeddingModule,
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
  controllers: [
    CurriculumExerciseController,
    CurriculumExerciseImportController,
    CurriculumEmbeddingController,
    CurriculumMergeController,
    CurriculumTreeController,
  ],
  providers: [
    CurriculumExerciseService,
    CurriculumExerciseImportService,
    CurriculumExerciseEmbeddingBackfillService,
    CurriculumMergeService,
    CurriculumTreeService,
  ],
  exports: [TypeOrmModule],
})
export class CurriculumModule {}
