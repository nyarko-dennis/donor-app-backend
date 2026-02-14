import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { Donation } from '../donations/donation.entity';
import { Donor } from '../donors/donor.entity';
import { Campaign } from '../campaigns/campaign.entity';
import { Constituency } from '../constituencies/constituency.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Donation, Donor, Campaign, Constituency])],
    controllers: [DashboardController],
    providers: [DashboardService],
})
export class DashboardModule { }
