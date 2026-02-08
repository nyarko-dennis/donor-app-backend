import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Constituency } from '../constituencies/constituency.entity';
import { SubConstituency } from '../constituencies/sub-constituency.entity';

@Entity('donors')
export class Donor {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ length: 100 })
    first_name: string;

    @Column({ length: 100 })
    last_name: string;

    @Column({ length: 255, unique: true })
    email: string;

    @Column({ length: 20, nullable: true })
    phone: string;

    @ManyToOne(() => Constituency, { nullable: true })
    @JoinColumn({ name: 'constituency_id' })
    constituency_entity: Constituency;

    @Column({ nullable: true })
    constituency_id: string;

    @ManyToOne(() => SubConstituency, { nullable: true })
    @JoinColumn({ name: 'sub_constituency_id' })
    sub_constituency_entity: SubConstituency;

    @Column({ nullable: true })
    sub_constituency_id: string;

    @Column({ length: 50, nullable: true })
    constituency: string;

    @Column({ length: 50, nullable: true })
    sub_constituency: string;

    @CreateDateColumn({ type: 'date' })
    date_joined: Date;
}
