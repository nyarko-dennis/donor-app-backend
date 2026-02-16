
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExportsController } from './exports.controller';
import { ExportsService } from './exports.service';
import { Donor } from '../donors/donor.entity';
import { Donation } from '../donations/donation.entity';
import { Campaign } from '../campaigns/campaign.entity';

@Module({
    imports: [TypeOrmModule.forFeature([
        Donor,
        Donation,
        Campaign,
    ])],
    controllers: [ExportsController],
    providers: [ExportsService],
})
export class ExportsModule { }
