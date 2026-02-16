import { IsOptional, IsString, IsDateString } from 'class-validator';

export class AnalyticsFilterDto {
    @IsOptional()
    @IsDateString()
    startDate?: string;

    @IsOptional()
    @IsDateString()
    endDate?: string;

    @IsOptional()
    @IsString()
    campaignId?: string;

    @IsOptional()
    @IsString()
    constituencyId?: string;
}
