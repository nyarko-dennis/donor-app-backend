import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('campaigns')
export class Campaign {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ length: 255 })
    name: string;

    @Column('text', { nullable: true })
    description: string;

    @Column({ length: 100, nullable: true })
    target_audience: string;

    @Column('decimal', { precision: 15, scale: 2, nullable: true })
    goal_amount: number;

    @Column({ type: 'date', nullable: true })
    start_date: string;

    @Column({ type: 'date', nullable: true })
    end_date: string;

    @Column({ length: 20, default: 'Active' })
    status: string;

    @CreateDateColumn()
    created_at: Date;
}
