import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Constituency } from './constituency.entity';

@Entity('sub_constituencies')
export class SubConstituency {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ length: 255 })
    name: string;

    @Column('text', { nullable: true })
    description: string;

    @Column('int', { nullable: true })
    order: number;

    @Column()
    constituency_id: string;

    @ManyToOne(() => Constituency, (constituency) => constituency.sub_constituencies, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'constituency_id' })
    constituency: Constituency;

    @CreateDateColumn()
    created_at: Date;
}
