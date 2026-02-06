import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

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

    @Column({ length: 50, nullable: true })
    constituency: string;

    @Column({ length: 50, nullable: true })
    sub_constituency: string;

    @CreateDateColumn({ type: 'date' })
    date_joined: Date;
}
