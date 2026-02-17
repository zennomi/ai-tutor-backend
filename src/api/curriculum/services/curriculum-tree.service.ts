import { CurriculumTreeGradeResDto } from '@/api/curriculum/dto/curriculum-tree.res.dto';
import { ListCurriculumTreeReqDto } from '@/api/curriculum/dto/list-curriculum-tree.req.dto';
import { GradeEntity } from '@/api/curriculum/entities/grade.entity';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class CurriculumTreeService {
  constructor(
    @InjectRepository(GradeEntity)
    private readonly gradeRepo: Repository<GradeEntity>,
  ) {}

  async list(
    query: ListCurriculumTreeReqDto,
  ): Promise<CurriculumTreeGradeResDto[]> {
    const qb = this.gradeRepo
      .createQueryBuilder('grade')
      .where('grade.deleted_at IS NULL')
      .leftJoinAndSelect(
        'grade.textbooks',
        'textbook',
        'textbook.deleted_at IS NULL',
      )
      .leftJoinAndSelect('textbook.units', 'unit', 'unit.deleted_at IS NULL')
      .leftJoinAndSelect('unit.lessons', 'lesson', 'lesson.deleted_at IS NULL')
      .leftJoinAndSelect(
        'lesson.exerciseTypes',
        'type',
        'type.deleted_at IS NULL',
      )
      .orderBy('grade.name', 'ASC')
      .addOrderBy('textbook.name', 'ASC')
      .addOrderBy('unit.name', 'ASC')
      .addOrderBy('lesson.name', 'ASC')
      .addOrderBy('type.name', 'ASC');

    if (Array.isArray(query.gradeIds) && query.gradeIds.length > 0) {
      qb.andWhere('grade.id IN (:...gradeIds)', {
        gradeIds: query.gradeIds,
      });
    }

    const grades = await qb.getMany();

    return grades
      .slice()
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((grade) => ({
        uuid: grade.id,
        name: grade.name,
        textbooks: (grade.textbooks ?? [])
          .slice()
          .sort((a, b) => a.name.localeCompare(b.name))
          .map((textbook) => ({
            uuid: textbook.id,
            name: textbook.name,
            units: (textbook.units ?? [])
              .slice()
              .sort((a, b) => a.name.localeCompare(b.name))
              .map((unit) => ({
                uuid: unit.id,
                name: unit.name,
                lessons: (unit.lessons ?? [])
                  .slice()
                  .sort((a, b) => a.name.localeCompare(b.name))
                  .map((lesson) => ({
                    uuid: lesson.id,
                    name: lesson.name,
                    types: (lesson.exerciseTypes ?? [])
                      .slice()
                      .sort((a, b) => a.name.localeCompare(b.name))
                      .map((type) => ({
                        uuid: type.id,
                        name: type.name,
                      })),
                  })),
              })),
          })),
      }));
  }
}
