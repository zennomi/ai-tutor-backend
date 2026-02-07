import { Uuid } from '@/common/types/common.type';
import { AbstractEntity } from '@/database/entities/abstract.entity';
import {
  Column,
  DeleteDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  Relation,
} from 'typeorm';
import { ExerciseEntity } from './exercise.entity';
import { ExerciseTypeEntity } from './exercise-type.entity';
import { UnitEntity } from './unit.entity';

@Entity('lesson')
export class LessonEntity extends AbstractEntity {
  constructor(data?: Partial<LessonEntity>) {
    super();
    Object.assign(this, data);
  }

  @PrimaryGeneratedColumn('uuid', { primaryKeyConstraintName: 'PK_lesson_id' })
  id!: Uuid;

  @Column({ length: 255 })
  name!: string;

  @Column({ name: 'unit_id', type: 'uuid' })
  @Index('idx_lesson_unit_id')
  unitId!: Uuid;

  @DeleteDateColumn({
    name: 'deleted_at',
    type: 'timestamptz',
    default: null,
  })
  deletedAt: Date | null;

  @JoinColumn({
    name: 'unit_id',
    referencedColumnName: 'id',
    foreignKeyConstraintName: 'FK_lesson_unit_id',
  })
  @ManyToOne(() => UnitEntity, (unit) => unit.lessons)
  unit: Relation<UnitEntity>;

  @OneToMany(() => ExerciseEntity, (exercise) => exercise.lesson)
  exercises: Relation<ExerciseEntity[]>;

  @OneToMany(() => ExerciseTypeEntity, (exerciseType) => exerciseType.lesson)
  exerciseTypes: Relation<ExerciseTypeEntity[]>;
}
