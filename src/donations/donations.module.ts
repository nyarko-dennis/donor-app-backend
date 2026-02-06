import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DonationsService } from './donations.service';
import { DonationsController } from './donations.controller';
import { Donation } from './donation.entity';
import { Donor } from '../donors/donor.entity';
import { Campaign } from '../campaigns/campaign.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Donation, Donor, Campaign])],
    providers: [DonationsService],
    controllers: [DonationsController],
})
export class DonationsModule { }
