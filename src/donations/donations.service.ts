import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Donation } from './donation.entity';
import { CreateDonationDto } from './dto/create-donation.dto';
import { UpdateDonationDto } from './dto/update-donation.dto';
import { DonationsPageOptionsDto } from './dto/donations-page-options.dto';
import { PageMetaDto } from '../common/dto/page-meta.dto';
import { PageDto } from '../common/dto/page.dto';
import { Donor } from '../donors/donor.entity';
import { Campaign } from '../campaigns/campaign.entity';
import { PaymentService } from '../payment/payment.service';
import { QueueService } from '../queue/queue.service';
import * as crypto from 'crypto';

@Injectable()
export class DonationsService {
    private readonly logger = new Logger(DonationsService.name);

    constructor(
        @InjectRepository(Donation)
        private donationsRepository: Repository<Donation>,
        @InjectRepository(Donor)
        private donorsRepository: Repository<Donor>,
        @InjectRepository(Campaign)
        private campaignsRepository: Repository<Campaign>,
        private paymentService: PaymentService,
        private queueService: QueueService,
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
            status: 'PENDING',
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
            queryBuilder.andWhere('donation.donor.id = :donorId', { donorId: pageOptionsDto.donorId });
        }

        if (pageOptionsDto.campaignId) {
            queryBuilder.andWhere('donation.campaign.id = :campaignId', { campaignId: pageOptionsDto.campaignId });
        }

        if (pageOptionsDto.causeId) {
            queryBuilder.andWhere('donation.cause.id = :causeId', { causeId: pageOptionsDto.causeId });
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
            .orderBy(`donation.${pageOptionsDto.sortBy || 'donation_date'}`, pageOptionsDto.order)
            .skip(pageOptionsDto.skip)
            .take(pageOptionsDto.take);

        const itemCount = await queryBuilder.getCount();
        const { entities } = await queryBuilder.getRawAndEntities();

        const pageMetaDto = new PageMetaDto({ itemCount, pageOptionsDto });

        return new PageDto(entities, pageMetaDto);
    }

    async findOne(id: string): Promise<Donation | null> {
        return this.donationsRepository.findOne({
            where: { id },
            relations: ['donor', 'campaign', 'cause'],
        });
    }

    async update(id: string, updateDonationDto: UpdateDonationDto) {
        await this.donationsRepository.update(id, updateDonationDto);
        return this.donationsRepository.findOne({ where: { id } });
    }

    async remove(id: string): Promise<void> {
        await this.donationsRepository.delete(id);
    }

    async initiateDonation(createDonationDto: CreateDonationDto, user: any) {
        const { donorId, campaignId, ...donationData } = createDonationDto;

        // Verify donor exists (using the ID from DTO or user context)
        // If user is donor, we might enforce donorId = user.id if linked.
        const donor = await this.donorsRepository.findOneBy({ id: donorId });
        if (!donor) {
            throw new NotFoundException(`Donor with ID ${donorId} not found`);
        }

        const campaign = await this.campaignsRepository.findOneBy({ id: campaignId });
        if (!campaign) {
            throw new NotFoundException(`Campaign with ID ${campaignId} not found`);
        }

        // 1. Create a PENDING donation record
        const donation = this.donationsRepository.create({
            ...donationData,
            donor,
            campaign,
            status: 'PENDING',
            idempotency_key: crypto.randomUUID(),
            donation_date: new Date(),
        });

        const savedDonation = await this.donationsRepository.save(donation);

        // 2. Initialize payment with provider
        const provider = 'paystack'; // Fixed for now, can be dynamic

        const paymentData = {
            amount: savedDonation.amount,
            email: donor.email || user.email, // Fallback to user email if donor doesn't have one
            currency: savedDonation.currency,
            metadata: {
                donation_id: savedDonation.id,
                custom_fields: [
                    {
                        display_name: "Donation ID",
                        variable_name: "donation_id",
                        value: savedDonation.id
                    }
                ]
            }
        };

        try {
            const initialization = await this.paymentService.initialize(provider, paymentData);

            if (!initialization.status) {
                savedDonation.status = 'FAILED';
                await this.donationsRepository.save(savedDonation);
                throw new BadRequestException('Payment initialization failed: ' + initialization.message);
            }

            // Update reference
            savedDonation.reference = initialization.data.reference;
            savedDonation.provider = provider;
            await this.donationsRepository.save(savedDonation);

            return {
                donation: savedDonation,
                checkout_url: initialization.data.authorization_url,
                access_code: initialization.data.access_code,
                reference: initialization.data.reference
            };

        } catch (error) {
            this.logger.error(`Payment initialization error: ${error.message}`);
            // If it was our error (not axios), still fail
            if (savedDonation.status === 'PENDING') {
                savedDonation.status = 'FAILED';
                await this.donationsRepository.save(savedDonation);
            }
            throw error;
        }
    }

    async handleSuccessWebhook(reference: string, provider: string) {
        this.logger.log(`Handling success webhook for reference: ${reference}`);

        const donation = await this.donationsRepository.findOne({
            where: { reference },
            relations: ['donor']
        });

        if (!donation) {
            this.logger.warn(`Donation not found for reference: ${reference}`);
            return;
        }

        if (donation.status === 'SUCCESS') {
            this.logger.log(`Donation ${donation.id} already processed`);
            return;
        }

        donation.status = 'SUCCESS';
        await this.donationsRepository.save(donation);

        // Push to queue for post-processing
        await this.queueService.send('donation-processing', {
            donationId: donation.id,
            amount: donation.amount,
            donorId: donation.donor?.id,
            email: donation.donor?.email
        });

        this.logger.log(`Donation ${donation.id} processed and job queued`);
    }
}
