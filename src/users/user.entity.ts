import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

export enum UserRole {
    SUPER_ADMIN = 'SUPER_ADMIN',
    ADMIN = 'ADMIN',
    STAKEHOLDER = 'STAKEHOLDER',
}

@Entity('users')
export class User {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ unique: true })
    email: string;

    @Column()
    password: string;

    @Column()
    first_name: string;

    @Column()
    last_name: string;

    @Column({
        type: 'enum',
        enum: UserRole,
        default: UserRole.STAKEHOLDER,
    })
    role: UserRole;

    @Column({ default: true })
    is_active: boolean;

    @Column({ nullable: true })
    two_factor_secret: string;

    @Column({ default: false })
    is_two_factor_enabled: boolean;

    @CreateDateColumn()
    created_at: Date;
}
