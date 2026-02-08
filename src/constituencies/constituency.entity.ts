import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany } from 'typeorm';
import { SubConstituency } from './sub-constituency.entity';

@Entity('constituencies')
export class Constituency {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ length: 255, unique: true })
    name: string;

    @OneToMany(() => SubConstituency, (subConstituency) => subConstituency.constituency)
    sub_constituencies: SubConstituency[];

    @CreateDateColumn()
    created_at: Date;
}
