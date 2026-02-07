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
import { TextbookEntity } from './textbook.entity';

@Entity('grade')
export class GradeEntity extends AbstractEntity {
  constructor(data?: Partial<GradeEntity>) {
    super();
    Object.assign(this, data);
  }

  @PrimaryGeneratedColumn('uuid', { primaryKeyConstraintName: 'PK_grade_id' })
  id!: Uuid;

  @Column({ length: 255 })
  name!: string;

  @DeleteDateColumn({
    name: 'deleted_at',
    type: 'timestamptz',
    default: null,
  })
  deletedAt: Date | null;

  @OneToMany(() => TextbookEntity, (textbook) => textbook.grade)
  textbooks: Relation<TextbookEntity[]>;
}
