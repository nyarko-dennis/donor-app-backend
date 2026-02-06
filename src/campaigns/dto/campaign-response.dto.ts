import { ApiProperty } from '@nestjs/swagger';
import { Campaign } from '../campaign.entity';

export class CampaignResponseDto {
    @ApiProperty()
    id: string;

    @ApiProperty()
    name: string;

    @ApiProperty({ required: false })
    description: string;

    @ApiProperty({ required: false })
    target_audience: string;

    @ApiProperty({ required: false })
    goal_amount: number;

    @ApiProperty({ required: false })
    start_date: string;

    @ApiProperty({ required: false })
    end_date: string;

    @ApiProperty()
    status: string;

    @ApiProperty()
    created_at: Date;

    constructor(campaign: Campaign) {
        this.id = campaign.id;
        this.name = campaign.name;
        this.description = campaign.description;
        this.target_audience = campaign.target_audience;
        this.goal_amount = Number(campaign.goal_amount); // Ensure number
        this.start_date = campaign.start_date;
        this.end_date = campaign.end_date;
        this.status = campaign.status;
        this.created_at = campaign.created_at;
    }
}
