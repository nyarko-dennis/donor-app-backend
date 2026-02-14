import { ApiProperty } from '@nestjs/swagger';
import { Donation } from '../donation.entity';

class MinimalDonorDto {
    @ApiProperty()
    id: string;

    @ApiProperty()
    first_name: string;

    @ApiProperty()
    last_name: string;

    @ApiProperty()
    email: string;
}

class MinimalCampaignDto {
    @ApiProperty()
    id: string;

    @ApiProperty()
    name: string;

    @ApiProperty()
    status: string;
}

export class DonationResponseDto {
    @ApiProperty()
    id: string;

    @ApiProperty()
    amount: number;

    @ApiProperty()
    currency: string;

    @ApiProperty()
    payment_method: string;

    @ApiProperty()
    donation_cause: string;

    @ApiProperty()
    payment_status: string;

    @ApiProperty({ nullable: true })
    reference: string | null;

    @ApiProperty({ type: MinimalDonorDto, nullable: true })
    donor: MinimalDonorDto | null;

    @ApiProperty({ type: MinimalCampaignDto, nullable: true })
    campaign: MinimalCampaignDto | null;

    @ApiProperty()
    created_at: Date;

    constructor(donation: Donation) {
        this.id = donation.id;
        this.amount = Number(donation.amount);
        this.currency = donation.currency;
        this.payment_method = donation.payment_method;
        this.donation_cause = donation.cause ? donation.cause.name : 'Unknown';
        this.payment_status = donation.transaction?.status || 'N/A';
        this.reference = donation.transaction?.reference || null;
        this.donor = donation.donor ? {
            id: donation.donor.id,
            first_name: donation.donor.first_name,
            last_name: donation.donor.last_name,
            email: donation.donor.email,
        } : null;
        this.campaign = donation.campaign ? {
            id: donation.campaign.id,
            name: donation.campaign.name,
            status: donation.campaign.status,
        } : null;
        this.created_at = donation.donation_date;
    }
}

