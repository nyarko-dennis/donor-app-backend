import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('constituencies')
export class Constituency {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ length: 255, unique: true })
    name: string;

    @CreateDateColumn()
    created_at: Date;
}
