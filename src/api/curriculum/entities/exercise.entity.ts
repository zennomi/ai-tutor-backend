import { Uuid } from '@/common/types/common.type';
import { AbstractEntity } from '@/database/entities/abstract.entity';
import {
  Column,
  DeleteDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Relation,
} from 'typeorm';
import { ExerciseTypeEntity } from './exercise-type.entity';
import { FormatEntity } from './format.entity';
import { LessonEntity } from './lesson.entity';

@Entity('exercise')
export class ExerciseEntity extends AbstractEntity {
  constructor(data?: Partial<ExerciseEntity>) {
    super();
    Object.assign(this, data);
  }

  @PrimaryGeneratedColumn('uuid', {
    primaryKeyConstraintName: 'PK_exercise_id',
  })
  id!: Uuid;

  @Column({ name: 'lesson_id', type: 'uuid' })
  lessonId!: Uuid;

  @Column({ name: 'format_id', type: 'uuid' })
  formatId!: Uuid;

  @Column({ name: 'type_id', type: 'uuid', nullable: true })
  typeId?: Uuid | null;

  @Column({ type: 'text' })
  question!: string;

  // Stored in DB as pgvector; mapped as text to satisfy TypeORM validation
  @Column({
    type: 'vector',
    length: 1536,
    nullable: true,
    name: 'question_embedding',
  })
  @Index('idx_exercise_question_embedding', {
    where:
      'USING ivfflat (question_embedding vector_l2_ops) WITH (lists = 100)',
  })
  questionEmbedding?: number[] | null;

  @Column({ type: 'text' })
  solution!: string;

  @Column({ type: 'text' })
  key!: string;

  @Column({ name: 'has_image', type: 'boolean', default: false })
  hasImage!: boolean;

  @DeleteDateColumn({
    name: 'deleted_at',
    type: 'timestamptz',
    default: null,
  })
  deletedAt: Date | null;

  @JoinColumn({
    name: 'lesson_id',
    referencedColumnName: 'id',
    foreignKeyConstraintName: 'FK_exercise_lesson_id',
  })
  @ManyToOne(() => LessonEntity, (lesson) => lesson.exercises)
  lesson: Relation<LessonEntity>;

  @JoinColumn({
    name: 'format_id',
    referencedColumnName: 'id',
    foreignKeyConstraintName: 'FK_exercise_format_id',
  })
  @ManyToOne(() => FormatEntity, (format) => format.exercises)
  format: Relation<FormatEntity>;

  @JoinColumn({
    name: 'type_id',
    referencedColumnName: 'id',
    foreignKeyConstraintName: 'FK_exercise_type_id',
  })
  @ManyToOne(() => ExerciseTypeEntity, (type) => type.exercises, {
    nullable: true,
  })
  type: Relation<ExerciseTypeEntity>;
}
