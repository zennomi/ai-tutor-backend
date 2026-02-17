import { Uuid } from '@/common/types/common.type';
import type { ImportResult } from '@/common/types/curriculum.type';
import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, IsNull, Raw } from 'typeorm';
import { BulkExerciseImportItemDto } from '../dto/bulk-exercise-import.dto';
import { ExerciseTypeEntity } from '../entities/exercise-type.entity';
import { ExerciseEntity } from '../entities/exercise.entity';
import { FormatEntity } from '../entities/format.entity';
import { GradeEntity } from '../entities/grade.entity';
import { LessonEntity } from '../entities/lesson.entity';
import { TextbookEntity } from '../entities/textbook.entity';
import { UnitEntity } from '../entities/unit.entity';

@Injectable()
export class CurriculumExerciseImportService {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  async importExercises(
    items: BulkExerciseImportItemDto[],
    userId: string,
  ): Promise<ImportResult> {
    const duplicates: BulkExerciseImportItemDto[] = [];
    let inserted = 0;
    const newGrades = new Set<string>();
    const newUnits = new Set<string>();
    const newLessons = new Set<string>();
    const newFormats = new Set<string>();
    const newTypes = new Set<string>();

    if (!items.length) {
      return {
        inserted,
        duplicateExercise: duplicates,
        newGrades: [],
        newUnits: [],
        newLessons: [],
        newFormats: [],
        newTypes: [],
      };
    }

    await this.dataSource.transaction(async (manager) => {
      const gradeRepo = manager.getRepository(GradeEntity);
      const textbookRepo = manager.getRepository(TextbookEntity);
      const unitRepo = manager.getRepository(UnitEntity);
      const lessonRepo = manager.getRepository(LessonEntity);
      const formatRepo = manager.getRepository(FormatEntity);
      const typeRepo = manager.getRepository(ExerciseTypeEntity);
      const exerciseRepo = manager.getRepository(ExerciseEntity);

      const gradeCache = new Map<string, GradeEntity>();
      const textbookCache = new Map<string, TextbookEntity>();
      const unitCache = new Map<string, UnitEntity>();
      const lessonCache = new Map<string, LessonEntity>();
      const formatCache = new Map<string, FormatEntity>();
      const typeCache = new Map<string, ExerciseTypeEntity>();

      const normalize = (value: string): string => value.trim().toLowerCase();
      const nameInsensitive = (value: string) =>
        Raw((alias) => `LOWER(${alias}) = LOWER(:name)`, {
          name: value.trim(),
        });

      const getOrCreateGrade = async (name: string): Promise<GradeEntity> => {
        const key = normalize(name);
        const cached = gradeCache.get(key);
        if (cached) {
          return cached;
        }

        let grade = await gradeRepo.findOne({
          where: { name: nameInsensitive(name), deletedAt: IsNull() },
        });

        if (!grade) {
          grade = await gradeRepo.save(
            new GradeEntity({ name, createdBy: userId, updatedBy: userId }),
          );
          newGrades.add(name);
        }

        gradeCache.set(key, grade);
        return grade;
      };

      const getOrCreateTextbook = async (
        gradeId: Uuid,
        name: string,
      ): Promise<TextbookEntity> => {
        const key = `${gradeId}:${normalize(name)}`;
        const cached = textbookCache.get(key);
        if (cached) {
          return cached;
        }

        let textbook = await textbookRepo.findOne({
          where: {
            name: nameInsensitive(name),
            gradeId,
            deletedAt: IsNull(),
          },
        });

        if (!textbook) {
          textbook = await textbookRepo.save(
            new TextbookEntity({
              name,
              gradeId,
              createdBy: userId,
              updatedBy: userId,
            }),
          );
        }

        textbookCache.set(key, textbook);
        return textbook;
      };

      const getOrCreateUnit = async (
        textbookId: Uuid,
        name: string,
      ): Promise<UnitEntity> => {
        const key = `${textbookId}:${normalize(name)}`;
        const cached = unitCache.get(key);
        if (cached) {
          return cached;
        }

        let unit = await unitRepo.findOne({
          where: {
            name: nameInsensitive(name),
            textbookId,
            deletedAt: IsNull(),
          },
        });

        if (!unit) {
          unit = await unitRepo.save(
            new UnitEntity({
              name,
              textbookId,
              createdBy: userId,
              updatedBy: userId,
            }),
          );
          newUnits.add(name);
        }

        unitCache.set(key, unit);
        return unit;
      };

      const getOrCreateLesson = async (
        unitId: Uuid,
        name: string,
      ): Promise<LessonEntity> => {
        const key = `${unitId}:${normalize(name)}`;
        const cached = lessonCache.get(key);
        if (cached) {
          return cached;
        }

        let lesson = await lessonRepo.findOne({
          where: { name: nameInsensitive(name), unitId, deletedAt: IsNull() },
        });

        if (!lesson) {
          lesson = await lessonRepo.save(
            new LessonEntity({
              name,
              unitId,
              createdBy: userId,
              updatedBy: userId,
            }),
          );
          newLessons.add(name);
        }

        lessonCache.set(key, lesson);
        return lesson;
      };

      const getOrCreateFormat = async (name: string): Promise<FormatEntity> => {
        const key = normalize(name);
        const cached = formatCache.get(key);
        if (cached) {
          return cached;
        }

        let format = await formatRepo.findOne({
          where: { name: nameInsensitive(name), deletedAt: IsNull() },
        });

        if (!format) {
          format = await formatRepo.save(
            new FormatEntity({ name, createdBy: userId, updatedBy: userId }),
          );
          newFormats.add(name);
        }

        formatCache.set(key, format);
        return format;
      };

      const getOrCreateType = async (
        lessonId: Uuid,
        name?: string,
      ): Promise<ExerciseTypeEntity | null> => {
        if (!name) {
          return null;
        }

        const key = `${lessonId}:${normalize(name)}`;
        const cached = typeCache.get(key);
        if (cached) {
          return cached;
        }

        let exerciseType = await typeRepo.findOne({
          where: {
            name: nameInsensitive(name),
            lessonId,
            deletedAt: IsNull(),
          },
        });

        if (!exerciseType) {
          exerciseType = await typeRepo.save(
            new ExerciseTypeEntity({
              name,
              lessonId,
              createdBy: userId,
              updatedBy: userId,
            }),
          );
          newTypes.add(name);
        }

        typeCache.set(key, exerciseType);
        return exerciseType;
      };

      for (const item of items) {
        const grade = await getOrCreateGrade(item.grade);
        const textbook = await getOrCreateTextbook(grade.id, item.textbook);
        const unit = await getOrCreateUnit(textbook.id, item.unit);
        const lesson = await getOrCreateLesson(unit.id, item.lesson);
        const format = await getOrCreateFormat(item.format);
        const exerciseType = await getOrCreateType(lesson.id, item.type);

        const existingExercise = await exerciseRepo
          .createQueryBuilder('exercise')
          .where('exercise.lesson_id = :lessonId', { lessonId: lesson.id })
          .andWhere('exercise.deleted_at IS NULL')
          .andWhere('LOWER(exercise.question) = LOWER(:question)', {
            question: item.question,
          })
          .andWhere('LOWER(exercise.key) = LOWER(:key)', { key: item.key })
          .getOne();

        if (existingExercise) {
          duplicates.push(item);
          continue;
        }

        const exercise = new ExerciseEntity({
          lessonId: lesson.id,
          formatId: format.id,
          typeId: exerciseType?.id ?? null,
          question: item.question,
          solution: item.solution,
          key: item.key,
          hasImage: item.hasImage ?? false,
          createdBy: userId,
          updatedBy: userId,
        });

        await exerciseRepo.save(exercise);
        inserted += 1;
      }
    });

    return {
      inserted,
      duplicateExercise: duplicates,
      newGrades: Array.from(newGrades),
      newUnits: Array.from(newUnits),
      newLessons: Array.from(newLessons),
      newFormats: Array.from(newFormats),
      newTypes: Array.from(newTypes),
    };
  }
}
