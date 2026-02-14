import { IsNumber, IsString, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { Donation } from '../../donations/donation.entity';

export class DashboardSummaryDto {
    @IsNumber()
    totalDonations: number;

    @IsNumber()
    totalDonors: number;

    @IsNumber()
    activeCampaigns: number;

    @IsNumber()
    averageDonation: number;
}

export class ChartDataDto {
    @IsString()
    label: string;

    @IsNumber()
    value: number;
}

export class DonationTrendDto {
    @IsString()
    date: string;

    @IsNumber()
    amount: number;
}

export class DashboardChartsDto {
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => DonationTrendDto)
    donationTrends: DonationTrendDto[];

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => ChartDataDto)
    donationsByCampaign: ChartDataDto[];

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => ChartDataDto)
    donorsByConstituency: ChartDataDto[];

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => ChartDataDto)
    paymentMethods: ChartDataDto[];
}

export class DashboardActivityDto {
    @IsArray()
    recentDonations: Donation[];
}

export class DashboardStatsDto {
    @ValidateNested()
    @Type(() => DashboardSummaryDto)
    summary: DashboardSummaryDto;

    @ValidateNested()
    @Type(() => DashboardChartsDto)
    charts: DashboardChartsDto;

    @ValidateNested()
    @Type(() => DashboardActivityDto)
    recentActivity: DashboardActivityDto;
}
