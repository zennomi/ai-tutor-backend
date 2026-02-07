import { TextbookEntity } from '@/api/curriculum/entities/textbook.entity';
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
import { LessonEntity } from './lesson.entity';

@Entity('unit')
export class UnitEntity extends AbstractEntity {
  constructor(data?: Partial<UnitEntity>) {
    super();
    Object.assign(this, data);
  }

  @PrimaryGeneratedColumn('uuid', { primaryKeyConstraintName: 'PK_unit_id' })
  id!: Uuid;

  @Column({ length: 255 })
  name!: string;

  @Column({ name: 'textbook_id', type: 'uuid' })
  @Index('idx_unit_textbook_id')
  textbookId!: Uuid;

  @DeleteDateColumn({
    name: 'deleted_at',
    type: 'timestamptz',
    default: null,
  })
  deletedAt: Date | null;

  @JoinColumn({
    name: 'textbook_id',
    referencedColumnName: 'id',
    foreignKeyConstraintName: 'FK_unit_textbook_id',
  })
  @ManyToOne(() => TextbookEntity, (textbook) => textbook.units)
  textbook: Relation<TextbookEntity>;

  @OneToMany(() => LessonEntity, (lesson) => lesson.unit)
  lessons: Relation<LessonEntity[]>;
}
