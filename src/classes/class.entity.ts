import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

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

    @CreateDateColumn()
    created_at: Date;
}
