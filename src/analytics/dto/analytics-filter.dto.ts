import { IsOptional, IsString, IsDateString } from 'class-validator';
import { Transform } from 'class-transformer';

export class AnalyticsFilterDto {
    @IsOptional()
    @IsDateString()
    startDate?: string;

    @IsOptional()
    @IsDateString()
    endDate?: string;

    @IsOptional()
    @Transform(({ value }) => (typeof value === 'string' ? value.split(',') : value))
    @IsString({ each: true })
    campaignId?: string | string[];

    @IsOptional()
    @Transform(({ value }) => (typeof value === 'string' ? value.split(',') : value))
    @IsString({ each: true })
    constituencyId?: string | string[];
}
