import { ApiProperty } from '@nestjs/swagger';
import { Donation } from '../donation.entity';

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
    donor_id: string;

    @ApiProperty()
    campaign_id: string;

    @ApiProperty()
    created_at: Date;

    constructor(donation: Donation) {
        this.id = donation.id;
        this.amount = Number(donation.amount);
        this.currency = donation.currency;
        this.payment_method = donation.payment_method;
        this.donation_cause = donation.donation_cause;
        this.donor_id = donation.donor ? donation.donor.id : '';
        this.campaign_id = donation.campaign ? donation.campaign.id : '';
        this.created_at = donation.donation_date;
    }
}
