import { ExerciseEntity } from '@/api/curriculum/entities/exercise.entity';
import { LessonEntity } from '@/api/curriculum/entities/lesson.entity';
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

@Entity('exercise_type')
export class ExerciseTypeEntity extends AbstractEntity {
  constructor(data?: Partial<ExerciseTypeEntity>) {
    super();
    Object.assign(this, data);
  }

  @PrimaryGeneratedColumn('uuid', {
    primaryKeyConstraintName: 'PK_exercise_type_id',
  })
  id!: Uuid;

  @Column({ length: 255 })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description?: string | null;

  @Column({ name: 'lesson_id', type: 'uuid', nullable: true })
  @Index('idx_exercise_type_lesson_id')
  lessonId: Uuid | null;

  @DeleteDateColumn({
    name: 'deleted_at',
    type: 'timestamptz',
    default: null,
  })
  deletedAt: Date | null;

  @JoinColumn({
    name: 'lesson_id',
    referencedColumnName: 'id',
    foreignKeyConstraintName: 'FK_exercise_type_lesson_id',
  })
  @ManyToOne(() => LessonEntity, (lesson) => lesson.exerciseTypes)
  lesson: Relation<LessonEntity>;

  @OneToMany(() => ExerciseEntity, (exercise) => exercise.type)
  exercises: Relation<ExerciseEntity[]>;
}
