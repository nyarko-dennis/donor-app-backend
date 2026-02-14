import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DonationsService } from './donations.service';
import { DonationsController } from './donations.controller';
import { Donation } from './donation.entity';
import { Transaction } from './transaction.entity';
import { PaymentModule } from '../payment/payment.module';
import { QueueModule } from '../queue/queue.module';
import { DonorsModule } from '../donors/donors.module';
import { CampaignsModule } from '../campaigns/campaigns.module';
import { Donor } from '../donors/donor.entity';
import { Campaign } from '../campaigns/campaign.entity';
import { DonationJob } from './jobs/donation.job';
import { Constituency } from '../constituencies/constituency.entity';
import { SubConstituency } from '../constituencies/sub-constituency.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            Donation,
            Transaction,
            Donor,
            Campaign,
            Constituency,
            SubConstituency
        ]),
        forwardRef(() => PaymentModule),
        QueueModule,
        DonorsModule,
        CampaignsModule,
    ],
    providers: [DonationsService, DonationJob],
    exports: [DonationsService],
    controllers: [DonationsController],
})
export class DonationsModule { }
