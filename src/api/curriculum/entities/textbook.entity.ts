import { GradeEntity } from '@/api/curriculum/entities/grade.entity';
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
import { UnitEntity } from './unit.entity';

@Entity('textbook')
export class TextbookEntity extends AbstractEntity {
  constructor(data?: Partial<TextbookEntity>) {
    super();
    Object.assign(this, data);
  }

  @PrimaryGeneratedColumn('uuid', {
    primaryKeyConstraintName: 'PK_textbook_id',
  })
  id!: Uuid;

  @Column({ length: 255 })
  name!: string;

  @Column({ name: 'grade_id', type: 'uuid' })
  @Index('idx_textbook_grade_id')
  gradeId!: Uuid;

  @DeleteDateColumn({
    name: 'deleted_at',
    type: 'timestamptz',
    default: null,
  })
  deletedAt: Date | null;

  @JoinColumn({
    name: 'grade_id',
    referencedColumnName: 'id',
    foreignKeyConstraintName: 'FK_textbook_grade_id',
  })
  @ManyToOne(() => GradeEntity, (grade) => grade.textbooks)
  grade: Relation<GradeEntity>;

  @OneToMany(() => UnitEntity, (unit) => unit.textbook)
  units: Relation<UnitEntity[]>;
}
