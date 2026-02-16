import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Donation } from "../donations/donation.entity";
import { Donor } from "../donors/donor.entity";
import { Campaign } from "../campaigns/campaign.entity";
import { AnalyticsController } from "./analytics.controller";
import { AnalyticsService } from "./analytics.service";

@Module({
    imports: [
        TypeOrmModule.forFeature([Donation, Donor, Campaign]),
    ],
    controllers: [AnalyticsController],
    providers: [AnalyticsService],
})
export class AnalyticsModule { }
