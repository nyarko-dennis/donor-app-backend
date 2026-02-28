import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { SubConstituency } from '../constituencies/sub-constituency.entity';

@Entity('classes')
export class Class {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255 })
  name: string;

  @Column('text', { nullable: true })
  description: string;

  @Column('int', { nullable: true })
  order: number;

  @Column('uuid')
  sub_constituency_id: string;

  @ManyToOne(
    () => SubConstituency,
    (subConstituency) => subConstituency.classes,
    { onDelete: 'CASCADE' },
  )
  @JoinColumn({ name: 'sub_constituency_id' })
  sub_constituency: SubConstituency;

  @CreateDateColumn()
  created_at: Date;
}
