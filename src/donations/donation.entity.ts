import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { Donor } from '../donors/donor.entity';
import { Campaign } from '../campaigns/campaign.entity';

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

    @Column({ length: 255, nullable: true })
    donation_cause: string;

    @CreateDateColumn()
    donation_date: Date;
}
