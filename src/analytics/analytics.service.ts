import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { Donation } from '../donations/donation.entity';
import { Donor } from '../donors/donor.entity';
import { Campaign } from '../campaigns/campaign.entity';
import { AnalyticsFilterDto } from './dto/analytics-filter.dto';

@Injectable()
export class AnalyticsService {
    constructor(
        @InjectRepository(Donation)
        private readonly donationRepository: Repository<Donation>,
        @InjectRepository(Donor)
        private readonly donorRepository: Repository<Donor>,
        @InjectRepository(Campaign)
        private readonly campaignRepository: Repository<Campaign>,
    ) { }

    private applyDonationFilters(qb: SelectQueryBuilder<Donation>, filter: AnalyticsFilterDto) {
        if (filter.startDate) {
            qb.andWhere('donation.donation_date >= :startDate', { startDate: filter.startDate });
        }
        if (filter.endDate) {
            qb.andWhere('donation.donation_date <= :endDate', { endDate: filter.endDate });
        }
        if (filter.campaignId) {
            if (Array.isArray(filter.campaignId)) {
                qb.andWhere('donation.campaign_id IN (:...campaignIds)', { campaignIds: filter.campaignId });
            } else {
                qb.andWhere('donation.campaign_id = :campaignId', { campaignId: filter.campaignId });
            }
        }
        if (filter.constituencyId) {
            if (Array.isArray(filter.constituencyId)) {
                qb.andWhere('donation.constituency_id IN (:...constituencyIds)', { constituencyIds: filter.constituencyId });
            } else {
                qb.andWhere('donation.constituency_id = :constituencyId', { constituencyId: filter.constituencyId });
            }
        }
    }

    async getOverview(filter: AnalyticsFilterDto) {
        const donationQb = this.donationRepository.createQueryBuilder('donation')
            .select('SUM(donation.amount)', 'totalRevenue')
            .addSelect('COUNT(donation.id)', 'totalDonations')
            .addSelect('AVG(donation.amount)', 'averageDonation');

        this.applyDonationFilters(donationQb, filter);
        const donationStats = await donationQb.getRawOne();

        const donorQb = this.donorRepository.createQueryBuilder('donor')
            .select('COUNT(donor.id)', 'totalDonors');

        if (filter.startDate) {
            donorQb.andWhere('donor.date_joined >= :startDate', { startDate: filter.startDate });
        }
        if (filter.endDate) {
            donorQb.andWhere('donor.date_joined <= :endDate', { endDate: filter.endDate });
        }
        if (filter.constituencyId) {
            if (Array.isArray(filter.constituencyId)) {
                donorQb.andWhere('donor.constituency_id IN (:...constituencyIds)', { constituencyIds: filter.constituencyId });
            } else {
                donorQb.andWhere('donor.constituency_id = :constituencyId', { constituencyId: filter.constituencyId });
            }
        }

        const donorStats = await donorQb.getRawOne();

        return {
            totalRevenue: parseFloat(donationStats.totalRevenue) || 0,
            totalDonations: parseInt(donationStats.totalDonations) || 0,
            averageDonation: parseFloat(donationStats.averageDonation) || 0,
            totalDonors: parseInt(donorStats.totalDonors) || 0,
        };
    }

    async getDonationsOverTime(filter: AnalyticsFilterDto) {
        const qb = this.donationRepository.createQueryBuilder('donation')
            .select("TO_CHAR(donation.donation_date, 'YYYY-MM-DD')", 'date')
            .addSelect('SUM(donation.amount)', 'amount')
            .groupBy("TO_CHAR(donation.donation_date, 'YYYY-MM-DD')")
            .orderBy('date', 'ASC');

        this.applyDonationFilters(qb, filter);

        const result = await qb.getRawMany();
        return result.map(r => ({
            date: r.date,
            amount: parseFloat(r.amount),
        }));
    }

    async getTopDonors(filter: AnalyticsFilterDto) {
        const qb = this.donationRepository.createQueryBuilder('donation')
            .leftJoinAndSelect('donation.donor', 'donor')
            .select('donor.id', 'donorId')
            .addSelect('donor.first_name', 'firstName')
            .addSelect('donor.last_name', 'lastName')
            .addSelect('donor.email', 'email')
            .addSelect('SUM(donation.amount)', 'totalAmount')
            .addSelect('COUNT(donation.id)', 'donationCount')
            .groupBy('donor.id')
            .orderBy('"totalAmount"', 'DESC')
            .limit(10);

        this.applyDonationFilters(qb, filter);

        const result = await qb.getRawMany();
        return result.map(r => ({
            id: r.donorId,
            name: `${r.firstName} ${r.lastName}`,
            email: r.email,
            totalAmount: parseFloat(r.totalAmount),
            donationCount: parseInt(r.donationCount),
        }));
    }

    async getCampaignPerformance(filter: AnalyticsFilterDto) {
        const qb = this.donationRepository.createQueryBuilder('donation')
            .leftJoin('donation.campaign', 'campaign')
            .select('campaign.name', 'campaignName')
            .addSelect('SUM(donation.amount)', 'totalRaised')
            .addSelect('COUNT(donation.id)', 'donationCount')
            .groupBy('campaign.name')
            .orderBy('"totalRaised"', 'DESC');

        this.applyDonationFilters(qb, filter);

        const result = await qb.getRawMany();
        return result.map(r => ({
            campaign: r.campaignName || 'Unassigned',
            totalRaised: parseFloat(r.totalRaised),
            donationCount: parseInt(r.donationCount),
        }));
    }

    async getGeoDistribution(filter: AnalyticsFilterDto) {
        const qb = this.donationRepository.createQueryBuilder('donation')
            .leftJoin('donation.constituency', 'constituency')
            .leftJoin('donation.sub_constituency', 'sub_constituency')
            .select('constituency.name', 'constituencyName')
            .addSelect('sub_constituency.name', 'subConstituencyName')
            .addSelect('SUM(donation.amount)', 'totalAmount')
            .addSelect('COUNT(donation.id)', 'donationCount')
            .groupBy('constituency.name')
            .addGroupBy('sub_constituency.name')
            .orderBy('"totalAmount"', 'DESC');

        this.applyDonationFilters(qb, filter);

        const result = await qb.getRawMany();
        return result.map(r => ({
            constituency: r.constituencyName || 'Unknown',
            subConstituency: r.subConstituencyName || 'Unknown',
            totalAmount: parseFloat(r.totalAmount),
            donationCount: parseInt(r.donationCount),
        }));
    }

    async getRetentionStats(filter: AnalyticsFilterDto) {
        // This is a simplified retention logic: Donors with > 1 donation vs 1 donation
        // For a more complex "Cohort Analysis", we'd need more complex SQL.

        const qb = this.donationRepository.createQueryBuilder('donation')
            .select('donation.donor_id', 'donorId')
            .addSelect('COUNT(donation.id)', 'count')
            .groupBy('donation.donor_id');

        // Apply filters to only consider donations within the period for the classification?
        // Usually retention is about "All Time" behavior, but let's respect the filter if provided
        // to see "Recurring donors *active* in this period" vs "One-time donors *in this period*"
        this.applyDonationFilters(qb, filter);

        const donorCounts = await qb.getRawMany();

        let oneTimeDonors = 0;
        let returningDonors = 0;

        donorCounts.forEach(d => {
            const count = parseInt(d.count);
            if (count === 1) {
                oneTimeDonors++;
            } else if (count > 1) {
                returningDonors++;
            }
        });

        return {
            oneTimeDonors,
            returningDonors,
            totalActiveDonors: oneTimeDonors + returningDonors
        };
    }
}
