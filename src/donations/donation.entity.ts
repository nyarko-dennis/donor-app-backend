import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToOne, JoinColumn, CreateDateColumn, DeleteDateColumn } from 'typeorm';
import { Donor } from '../donors/donor.entity';
import { Campaign } from '../campaigns/campaign.entity';
import { DonationCause } from '../donation-causes/donation-cause.entity';
import { Transaction } from './transaction.entity';
import { Constituency } from '../constituencies/constituency.entity';
import { SubConstituency } from '../constituencies/sub-constituency.entity';

@Entity('donations')
export class Donation {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => Donor, { onDelete: 'SET NULL', nullable: true })
    @JoinColumn({ name: 'donor_id' })
    donor: Donor;

    @Column({ nullable: true })
    donor_id: string;

    @ManyToOne(() => Campaign, { onDelete: 'CASCADE', nullable: true })
    @JoinColumn({ name: 'campaign_id' })
    campaign: Campaign;

    @Column({ nullable: true })
    campaign_id: string;

    @Column('decimal', { precision: 15, scale: 2 })
    amount: number;

    @Column({ length: 3, default: 'GHS' })
    currency: string;

    @Column({ length: 30, nullable: true })
    payment_method: string;

    @CreateDateColumn()
    donation_date: Date;

    @ManyToOne(() => DonationCause, { nullable: true })
    @JoinColumn({ name: 'donation_cause_id' })
    cause: DonationCause;

    @Column({ nullable: true })
    donation_cause_id: string;

    @OneToOne(() => Transaction, (transaction) => transaction.donation, { nullable: true, cascade: true })
    transaction: Transaction;

    @ManyToOne(() => Constituency, { nullable: true })
    @JoinColumn({ name: 'constituency_id' })
    constituency: Constituency;

    @Column({ nullable: true })
    constituency_id: string;

    @ManyToOne(() => SubConstituency, { nullable: true })
    @JoinColumn({ name: 'sub_constituency_id' })
    sub_constituency: SubConstituency;

    @Column({ nullable: true })
    sub_constituency_id: string;

    @DeleteDateColumn()
    deletedAt: Date;
}
