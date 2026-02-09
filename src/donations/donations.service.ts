import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Donation } from './donation.entity';
import { CreateDonationDto } from './dto/create-donation.dto';
import { PageOptionsDto } from '../common/dto/page-options.dto';
import { DonationsPageOptionsDto } from './dto/donations-page-options.dto';
import { PageDto } from '../common/dto/page.dto';
import { PageMetaDto } from '../common/dto/page-meta.dto';
import { Donor } from '../donors/donor.entity';
import { Campaign } from '../campaigns/campaign.entity';

@Injectable()
export class DonationsService {
    constructor(
        @InjectRepository(Donation)
        private donationsRepository: Repository<Donation>,
        @InjectRepository(Donor)
        private donorsRepository: Repository<Donor>,
        @InjectRepository(Campaign)
        private campaignsRepository: Repository<Campaign>,
    ) { }

    async create(createDonationDto: CreateDonationDto): Promise<Donation> {
        const { donorId, campaignId, ...donationData } = createDonationDto;

        const donor = await this.donorsRepository.findOneBy({ id: donorId });
        if (!donor) {
            throw new NotFoundException(`Donor with ID ${donorId} not found`);
        }

        const campaign = await this.campaignsRepository.findOneBy({ id: campaignId });
        if (!campaign) {
            throw new NotFoundException(`Campaign with ID ${campaignId} not found`);
        }

        const donation = this.donationsRepository.create({
            ...donationData,
            donor,
            campaign,
        });

        return this.donationsRepository.save(donation);
    }

    async findAll(pageOptionsDto: DonationsPageOptionsDto): Promise<PageDto<Donation>> {
        const queryBuilder = this.donationsRepository.createQueryBuilder('donation');

        queryBuilder
            .leftJoinAndSelect('donation.donor', 'donor')
            .leftJoinAndSelect('donation.campaign', 'campaign')
            .leftJoinAndSelect('donation.cause', 'cause');

        if (pageOptionsDto.search) {
            queryBuilder.where('(cause.name ILIKE :search OR donor.first_name ILIKE :search OR donor.last_name ILIKE :search)', {
                search: `%${pageOptionsDto.search}%`,
            });
        }

        if (pageOptionsDto.donorId) {
            queryBuilder.andWhere('donation.donor_id = :donorId', { donorId: pageOptionsDto.donorId });
        }

        if (pageOptionsDto.campaignId) {
            queryBuilder.andWhere('donation.campaign_id = :campaignId', { campaignId: pageOptionsDto.campaignId });
        }

        if (pageOptionsDto.causeId) {
            queryBuilder.andWhere('donation.donation_cause_id = :causeId', { causeId: pageOptionsDto.causeId });
        }

        if (pageOptionsDto.minAmount) {
            queryBuilder.andWhere('donation.amount >= :minAmount', { minAmount: pageOptionsDto.minAmount });
        }

        if (pageOptionsDto.maxAmount) {
            queryBuilder.andWhere('donation.amount <= :maxAmount', { maxAmount: pageOptionsDto.maxAmount });
        }

        if (pageOptionsDto.startDate) {
            queryBuilder.andWhere('donation.donation_date >= :startDate', { startDate: pageOptionsDto.startDate });
        }

        if (pageOptionsDto.endDate) {
            queryBuilder.andWhere('donation.donation_date <= :endDate', { endDate: pageOptionsDto.endDate });
        }

        if (pageOptionsDto.paymentMethod) {
            queryBuilder.andWhere('donation.payment_method = :paymentMethod', { paymentMethod: pageOptionsDto.paymentMethod });
        }

        queryBuilder
            .orderBy('donation.donation_date', pageOptionsDto.order)
            .skip(pageOptionsDto.skip)
            .take(pageOptionsDto.take);

        const itemCount = await queryBuilder.getCount();
        const { entities } = await queryBuilder.getRawAndEntities();

        const pageMetaDto = new PageMetaDto({ itemCount, pageOptionsDto });

        return new PageDto(entities, pageMetaDto);
    }

    findOne(id: string): Promise<Donation | null> {
        return this.donationsRepository.findOne({
            where: { id },
            relations: ['donor', 'campaign', 'cause'],
        });
    }

    async remove(id: string): Promise<void> {
        await this.donationsRepository.delete(id);
    }
}
