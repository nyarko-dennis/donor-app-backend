import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { AnalyticsFilterDto } from './dto/analytics-filter.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../users/user.entity';

@Controller('analytics')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.STAKEHOLDER)
export class AnalyticsController {
    constructor(private readonly analyticsService: AnalyticsService) { }

    @Get('overview')
    async getOverview(@Query() filter: AnalyticsFilterDto) {
        return this.analyticsService.getOverview(filter);
    }

    @Get('donations-over-time')
    async getDonationsOverTime(@Query() filter: AnalyticsFilterDto) {
        return this.analyticsService.getDonationsOverTime(filter);
    }

    @Get('top-donors')
    async getTopDonors(@Query() filter: AnalyticsFilterDto) {
        return this.analyticsService.getTopDonors(filter);
    }

    @Get('campaign-performance')
    async getCampaignPerformance(@Query() filter: AnalyticsFilterDto) {
        return this.analyticsService.getCampaignPerformance(filter);
    }

    @Get('geo-distribution')
    async getGeoDistribution(@Query() filter: AnalyticsFilterDto) {
        return this.analyticsService.getGeoDistribution(filter);
    }

    @Get('retention')
    async getRetentionStats(@Query() filter: AnalyticsFilterDto) {
        return this.analyticsService.getRetentionStats(filter);
    }
}
