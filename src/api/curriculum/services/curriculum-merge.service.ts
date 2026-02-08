import {
  CurriculumMergeDto,
  CurriculumMergeTable,
} from '@/api/curriculum/dto/merge-curriculum.dto';
import { ExerciseTypeEntity } from '@/api/curriculum/entities/exercise-type.entity';
import { ExerciseEntity } from '@/api/curriculum/entities/exercise.entity';
import { FormatEntity } from '@/api/curriculum/entities/format.entity';
import { GradeEntity } from '@/api/curriculum/entities/grade.entity';
import { LessonEntity } from '@/api/curriculum/entities/lesson.entity';
import { TextbookEntity } from '@/api/curriculum/entities/textbook.entity';
import { UnitEntity } from '@/api/curriculum/entities/unit.entity';
import { Uuid } from '@/common/types/common.type';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, FindOptionsWhere, IsNull, Repository } from 'typeorm';

export interface CurriculumMergeResult {
  table: CurriculumMergeTable;
  sourceId: string;
  destinationId: string;
  updatedCounts: {
    textbooks?: number;
    lessons?: number;
    exercises?: number;
    exerciseTypes?: number;
  };
  deleted: boolean;
}

@Injectable()
export class CurriculumMergeService {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  async merge(
    dto: CurriculumMergeDto,
    userId: string,
  ): Promise<CurriculumMergeResult> {
    const { table } = dto;
    const sourceId = dto.sourceId as Uuid;
    const destinationId = dto.destinationId as Uuid;

    if (sourceId === destinationId) {
      throw new BadRequestException(
        'sourceId and destinationId must be different',
      );
    }

    return this.dataSource.transaction(async (manager) => {
      const gradeRepo = manager.getRepository(GradeEntity);
      const textbookRepo = manager.getRepository(TextbookEntity);
      const unitRepo = manager.getRepository(UnitEntity);
      const lessonRepo = manager.getRepository(LessonEntity);
      const formatRepo = manager.getRepository(FormatEntity);
      const exerciseRepo = manager.getRepository(ExerciseEntity);
      const exerciseTypeRepo = manager.getRepository(ExerciseTypeEntity);

      const ensureActive = async <
        T extends { id: Uuid; deletedAt: Date | null },
      >(
        repo: Pick<Repository<T>, 'findOne'>,
        id: Uuid,
        name: string,
      ): Promise<T> => {
        const where: FindOptionsWhere<T> = {
          id: id as unknown as FindOptionsWhere<T>['id'],
          deletedAt: IsNull(),
        } as FindOptionsWhere<T>;
        const entity = await repo.findOne({ where });
        if (!entity) {
          throw new NotFoundException(`${name} not found`);
        }
        return entity;
      };

      const updatedCounts: CurriculumMergeResult['updatedCounts'] = {};

      switch (table) {
        case CurriculumMergeTable.Grade: {
          await ensureActive(gradeRepo, sourceId, 'Grade');
          await ensureActive(gradeRepo, destinationId, 'Grade');
          const result = await textbookRepo.update(
            { gradeId: sourceId as Uuid, deletedAt: IsNull() },
            { gradeId: destinationId as Uuid, updatedBy: userId },
          );
          updatedCounts.textbooks = result.affected ?? 0;
          await gradeRepo.update(
            { id: sourceId as Uuid },
            { updatedBy: userId },
          );
          await gradeRepo.softDelete({ id: sourceId as Uuid });
          break;
        }
        case CurriculumMergeTable.Unit: {
          await ensureActive(unitRepo, sourceId, 'Unit');
          await ensureActive(unitRepo, destinationId, 'Unit');
          const result = await lessonRepo.update(
            { unitId: sourceId as Uuid, deletedAt: IsNull() },
            { unitId: destinationId as Uuid, updatedBy: userId },
          );
          updatedCounts.lessons = result.affected ?? 0;
          await unitRepo.update(
            { id: sourceId as Uuid },
            { updatedBy: userId },
          );
          await unitRepo.softDelete({ id: sourceId as Uuid });
          break;
        }
        case CurriculumMergeTable.Lesson: {
          await ensureActive(lessonRepo, sourceId, 'Lesson');
          await ensureActive(lessonRepo, destinationId, 'Lesson');
          const result = await exerciseRepo.update(
            { lessonId: sourceId as Uuid, deletedAt: IsNull() },
            { lessonId: destinationId as Uuid, updatedBy: userId },
          );
          updatedCounts.exercises = result.affected ?? 0;

          const resultTypes = await exerciseTypeRepo.update(
            { lessonId: sourceId as Uuid, deletedAt: IsNull() },
            { lessonId: destinationId as Uuid, updatedBy: userId },
          );
          updatedCounts.exerciseTypes = resultTypes.affected ?? 0;

          await lessonRepo.update(
            { id: sourceId as Uuid },
            { updatedBy: userId },
          );
          await lessonRepo.softDelete({ id: sourceId as Uuid });
          break;
        }
        case CurriculumMergeTable.Format: {
          await ensureActive(formatRepo, sourceId, 'Format');
          await ensureActive(formatRepo, destinationId, 'Format');
          const result = await exerciseRepo.update(
            { formatId: sourceId as Uuid, deletedAt: IsNull() },
            { formatId: destinationId as Uuid, updatedBy: userId },
          );
          updatedCounts.exercises = result.affected ?? 0;
          await formatRepo.update(
            { id: sourceId as Uuid },
            { updatedBy: userId },
          );
          await formatRepo.softDelete({ id: sourceId as Uuid });
          break;
        }
        case CurriculumMergeTable.ExerciseType: {
          await ensureActive(exerciseTypeRepo, sourceId, 'ExerciseType');
          await ensureActive(exerciseTypeRepo, destinationId, 'ExerciseType');
          const result = await exerciseRepo.update(
            { typeId: sourceId as Uuid, deletedAt: IsNull() },
            { typeId: destinationId as Uuid, updatedBy: userId },
          );
          updatedCounts.exercises = result.affected ?? 0;
          await exerciseTypeRepo.update(
            { id: sourceId as Uuid },
            { updatedBy: userId },
          );
          await exerciseTypeRepo.softDelete({ id: sourceId as Uuid });
          break;
        }
        default: {
          throw new BadRequestException('Unsupported table');
        }
      }

      return {
        table,
        sourceId,
        destinationId,
        updatedCounts,
        deleted: true,
      };
    });
  }
}
