import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('teachers')
export class Teacher {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ length: 255 })
    name: string;

    @Column('text', { nullable: true })
    description: string;

    @CreateDateColumn()
    created_at: Date;
}
