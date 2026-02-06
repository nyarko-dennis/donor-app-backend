export class CreateDonationDto {
    donor_id?: string;
    campaign_id?: string;
    amount: number;
    currency?: string;
    payment_method?: string;
    donation_cause?: string;
}
