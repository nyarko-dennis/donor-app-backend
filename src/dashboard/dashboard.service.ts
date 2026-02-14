import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Donation } from '../donations/donation.entity';
import { Donor } from '../donors/donor.entity';
import { Campaign } from '../campaigns/campaign.entity';
import { DashboardStatsDto } from './dto/dashboard-stats.dto';

@Injectable()
export class DashboardService {
    constructor(
        @InjectRepository(Donation)
        private readonly donationRepository: Repository<Donation>,
        @InjectRepository(Donor)
        private readonly donorRepository: Repository<Donor>,
        @InjectRepository(Campaign)
        private readonly campaignRepository: Repository<Campaign>,
    ) { }

    async getStats(): Promise<DashboardStatsDto> {
        const summary = await this.getSummary();
        const charts = await this.getCharts();
        const recentActivity = await this.getRecentActivity();

        return {
            summary,
            charts,
            recentActivity,
        };
    }

    private async getSummary() {
        const totalDonationsResult = await this.donationRepository
            .createQueryBuilder('donation')
            .select('SUM(donation.amount)', 'total')
            .getRawOne();
        const totalDonations = parseFloat(totalDonationsResult.total) || 0;

        const totalDonors = await this.donorRepository.count();

        const activeCampaigns = await this.campaignRepository.count({
            where: { status: 'Active' },
        });

        const donationCount = await this.donationRepository.count();
        const averageDonation = donationCount > 0 ? totalDonations / donationCount : 0;

        return {
            totalDonations,
            totalDonors,
            activeCampaigns,
            averageDonation,
        };
    }

    private async getCharts() {
        // Donation Trends (Last 30 days)
        const trendsResult = await this.donationRepository
            .createQueryBuilder('donation')
            .select("TO_CHAR(donation.donation_date, 'YYYY-MM-DD')", 'date')
            .addSelect('SUM(donation.amount)', 'amount')
            .groupBy("TO_CHAR(donation.donation_date, 'YYYY-MM-DD')")
            .orderBy('date', 'ASC')
            .getRawMany();

        const donationTrends = trendsResult.map((r) => ({
            date: r.date,
            amount: parseFloat(r.amount),
        }));

        // Donations by Campaign
        const campaignResult = await this.donationRepository
            .createQueryBuilder('donation')
            .leftJoin('donation.campaign', 'campaign')
            .select('campaign.name', 'label')
            .addSelect('SUM(donation.amount)', 'value')
            .groupBy('campaign.name')
            .getRawMany();

        const donationsByCampaign = campaignResult.map((r) => ({
            label: r.label || 'Unknown',
            value: parseFloat(r.value),
        }));

        // Donors by Constituency
        const constituencyResult = await this.donorRepository
            .createQueryBuilder('donor')
            .leftJoin('donor.constituency_entity', 'constituency')
            .select('constituency.name', 'label')
            .addSelect('COUNT(donor.id)', 'value')
            .groupBy('constituency.name')
            .getRawMany();

        const donorsByConstituency = constituencyResult.map((r) => ({
            label: r.label || 'Unknown',
            value: parseInt(r.value, 10),
        }));

        // Payment Methods
        const paymentMethodResult = await this.donationRepository
            .createQueryBuilder('donation')
            .select('donation.payment_method', 'label')
            .addSelect('COUNT(donation.id)', 'value')
            .groupBy('donation.payment_method')
            .getRawMany();

        const paymentMethods = paymentMethodResult.map((r) => ({
            label: r.label || 'Unknown',
            value: parseInt(r.value, 10),
        }));


        return {
            donationTrends,
            donationsByCampaign,
            donorsByConstituency,
            paymentMethods
        };
    }

    private async getRecentActivity() {
        const recentDonations = await this.donationRepository.find({
            order: { donation_date: 'DESC' },
            take: 5,
            relations: ['donor', 'campaign'],
        });

        return {
            recentDonations
        };
    }
}
