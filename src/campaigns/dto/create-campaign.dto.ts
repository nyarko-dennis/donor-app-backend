export class CreateCampaignDto {
    name: string;
    description?: string;
    target_audience?: string;
    goal_amount?: number;
    start_date?: string;
    end_date?: string;
    status?: string;
}
