import { ListExerciseReqDto } from '@/api/curriculum/dto/list-exercise.req.dto';
import { SearchExercisesResDto } from '@/api/curriculum/dto/search-exercises.res.dto';
import { ExerciseEntity } from '@/api/curriculum/entities/exercise.entity';
import { OffsetPaginationDto } from '@/common/dto/offset-pagination/offset-pagination.dto';
import { OffsetPaginatedDto } from '@/common/dto/offset-pagination/paginated.dto';
import { EmbeddingService } from '@/libs/embedding/embedding.service';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { Repository } from 'typeorm';

@Injectable()
export class CurriculumExerciseService {
  constructor(
    @InjectRepository(ExerciseEntity)
    private readonly exerciseRepo: Repository<ExerciseEntity>,
    private readonly embeddingService: EmbeddingService,
  ) {}

  async list(
    req: ListExerciseReqDto,
  ): Promise<OffsetPaginatedDto<SearchExercisesResDto>> {
    const qb = this.exerciseRepo
      .createQueryBuilder('exercise')
      .where('exercise.deleted_at IS NULL')
      .leftJoinAndSelect('exercise.lesson', 'lesson')
      .leftJoinAndSelect('lesson.unit', 'unit')
      .leftJoinAndSelect('unit.textbook', 'textbook')
      .leftJoinAndSelect('textbook.grade', 'grade')
      .leftJoinAndSelect('exercise.type', 'type')
      .leftJoinAndSelect('exercise.format', 'format');

    if (Array.isArray(req.lessonIds) && req.lessonIds.length > 0) {
      qb.andWhere('exercise.lesson_id IN (:...lessonIds)', {
        lessonIds: req.lessonIds,
      });
    }

    if (Array.isArray(req.typeIds) && req.typeIds.length > 0) {
      qb.andWhere('exercise.type_id IN (:...typeIds)', {
        typeIds: req.typeIds,
      });
    }

    if (Array.isArray(req.formatIds) && req.formatIds.length > 0) {
      qb.andWhere('exercise.format_id IN (:...formatIds)', {
        formatIds: req.formatIds,
      });
    }

    if (Array.isArray(req.gradeIds) && req.gradeIds.length > 0) {
      qb.andWhere('grade.id IN (:...gradeIds)', {
        gradeIds: req.gradeIds,
      });
    }

    if (Array.isArray(req.textbookIds) && req.textbookIds.length > 0) {
      qb.andWhere('textbook.id IN (:...textbookIds)', {
        textbookIds: req.textbookIds,
      });
    }

    if (Array.isArray(req.unitIds) && req.unitIds.length > 0) {
      qb.andWhere('unit.id IN (:...unitIds)', {
        unitIds: req.unitIds,
      });
    }

    let embedding: number[] | null = null;

    if (req.search) {
      const embeddingResult = await this.embeddingService.embed(req.search);
      embedding = embeddingResult?.embedding ?? null;

      if (embedding) {
        qb.andWhere('exercise.question_embedding IS NOT NULL');
        qb.addSelect('exercise.question_embedding <-> :embedding', 'distance');
        qb.setParameter('embedding', JSON.stringify(embedding));
        qb.orderBy('distance', 'ASC');
        qb.addOrderBy('exercise.created_at', 'DESC');
      } else {
        qb.andWhere('exercise.question ILIKE :search', {
          search: `%${req.search}%`,
        });
        qb.orderBy('exercise.created_at', 'DESC');
      }
    } else {
      qb.orderBy('exercise.created_at', 'DESC');
    }

    qb.offset(req.offset).limit(req.limit);

    const { entities, raw } = await qb.getRawAndEntities();

    const count = await qb.getCount();
    const pagination = new OffsetPaginationDto(count, req);

    const data = plainToInstance(
      SearchExercisesResDto,
      entities.map((e, index) => {
        const distance = raw[index]?.distance;
        return {
          ...e,
          lesson: e.lesson?.name,
          unit: e.lesson?.unit?.name,
          textbook: e.lesson?.unit?.textbook?.name,
          grade: e.lesson?.unit?.textbook?.grade?.name,
          type: e.type?.name,
          format: e.format?.name,
          distance,
        };
      }),
      {
        excludeExtraneousValues: true,
      },
    );

    return new OffsetPaginatedDto(data, pagination);
  }
}
