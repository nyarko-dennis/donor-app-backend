import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Donation } from './donation.entity';

@Entity('transactions')
export class Transaction {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @OneToOne(() => Donation, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'donation_id' })
    donation: Donation;

    @Column()
    donation_id: string;

    @Column({ unique: true })
    reference: string;

    @Column({ length: 50 })
    provider: string; // 'paystack', 'flutterwave', etc.

    @Column({ default: 'PENDING' })
    status: 'PENDING' | 'SUCCESS' | 'FAILED';

    @Column({ nullable: true })
    access_code: string;

    @Column({ nullable: true })
    checkout_url: string;

    @Column({ nullable: true })
    idempotency_key: string;

    @Column({ type: 'jsonb', nullable: true })
    provider_response: Record<string, any>;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;
}
