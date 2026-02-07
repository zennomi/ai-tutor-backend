import { Uuid } from '@/common/types/common.type';
import { AbstractEntity } from '@/database/entities/abstract.entity';
import {
  Column,
  DeleteDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  Relation,
} from 'typeorm';
import { ExerciseEntity } from './exercise.entity';

@Entity('format')
export class FormatEntity extends AbstractEntity {
  constructor(data?: Partial<FormatEntity>) {
    super();
    Object.assign(this, data);
  }

  @PrimaryGeneratedColumn('uuid', {
    primaryKeyConstraintName: 'PK_format_id',
  })
  id!: Uuid;

  @Column({ length: 255 })
  name!: string;

  @DeleteDateColumn({
    name: 'deleted_at',
    type: 'timestamptz',
    default: null,
  })
  deletedAt: Date | null;

  @OneToMany(() => ExerciseEntity, (exercise) => exercise.format)
  exercises: Relation<ExerciseEntity[]>;
}
