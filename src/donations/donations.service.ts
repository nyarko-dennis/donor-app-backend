import { Injectable, OnModuleInit, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Donation } from './donation.entity';
import { Transaction } from './transaction.entity';
import { CreateDonationDto } from './dto/create-donation.dto';
import { InitiateDonationDto } from './dto/initiate-donation.dto';
import { UpdateDonationDto } from './dto/update-donation.dto';
import { DonationsPageOptionsDto } from './dto/donations-page-options.dto';
import { PageMetaDto } from '../common/dto/page-meta.dto';
import { PageDto } from '../common/dto/page.dto';
import { Donor } from '../donors/donor.entity';
import { Campaign } from '../campaigns/campaign.entity';
import { PaymentService } from '../payment/payment.service';
import { QueueService } from '../queue/queue.service';
import { DonationJob } from './jobs/donation.job';
import * as crypto from 'crypto';

import { Constituency } from '../constituencies/constituency.entity';
import { SubConstituency } from '../constituencies/sub-constituency.entity';
import { DonationCause } from '../donation-causes/donation-cause.entity';

@Injectable()
export class DonationsService implements OnModuleInit {
    private readonly logger = new Logger(DonationsService.name);

    constructor(
        @InjectRepository(Donation)
        private donationsRepository: Repository<Donation>,
        @InjectRepository(Transaction)
        private transactionsRepository: Repository<Transaction>,
        @InjectRepository(Donor)
        private donorsRepository: Repository<Donor>,
        @InjectRepository(Campaign)
        private campaignsRepository: Repository<Campaign>,
        @InjectRepository(Constituency)
        private constituenciesRepository: Repository<Constituency>,
        @InjectRepository(SubConstituency)
        private subConstituenciesRepository: Repository<SubConstituency>,
        @InjectRepository(DonationCause)
        private donationCausesRepository: Repository<DonationCause>,
        private paymentService: PaymentService,
        private queueService: QueueService,
        private donationJob: DonationJob,
    ) { }

    async onModuleInit() {
        await this.queueService.subscribe('donation-processing', async (job) => {
            await this.donationJob.handle(job);
        });
        this.logger.log('Subscribed to donation-processing queue');
    }

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

        let cause: DonationCause | null = null;
        if (donationData.donation_cause) {
            cause = await this.donationCausesRepository.findOneBy({ name: donationData.donation_cause });
            if (!cause) {
                // Determine if we should throw error or create? 
                // Given the scenario, throwing error is safer for data integrity if causes are managed entities.
                throw new NotFoundException(`Donation Cause '${donationData.donation_cause}' not found`);
            }
        }

        const donation = this.donationsRepository.create({
            ...donationData,
            donor,
            campaign,
            cause: cause || undefined,
        });

        return this.donationsRepository.save(donation);
    }

    async findAll(pageOptionsDto: DonationsPageOptionsDto): Promise<PageDto<Donation>> {
        const queryBuilder = this.donationsRepository.createQueryBuilder('donation');

        queryBuilder
            .leftJoinAndSelect('donation.donor', 'donor')
            .leftJoinAndSelect('donation.campaign', 'campaign')
            .leftJoinAndSelect('donation.cause', 'cause')
            .leftJoinAndSelect('donation.transaction', 'transaction');

        if (pageOptionsDto.search) {
            queryBuilder.where('(cause.name ILIKE :search OR donor.first_name ILIKE :search OR donor.last_name ILIKE :search)', {
                search: `%${pageOptionsDto.search}%`,
            });
        }

        if (pageOptionsDto.donorId) {
            if (Array.isArray(pageOptionsDto.donorId)) {
                queryBuilder.andWhere('donation.donor.id IN (:...donorIds)', { donorIds: pageOptionsDto.donorId });
            } else {
                queryBuilder.andWhere('donation.donor.id = :donorId', { donorId: pageOptionsDto.donorId });
            }
        }

        if (pageOptionsDto.campaignId) {
            if (Array.isArray(pageOptionsDto.campaignId)) {
                queryBuilder.andWhere('donation.campaign.id IN (:...campaignIds)', { campaignIds: pageOptionsDto.campaignId });
            } else {
                queryBuilder.andWhere('donation.campaign.id = :campaignId', { campaignId: pageOptionsDto.campaignId });
            }
        }

        if (pageOptionsDto.causeId) {
            if (Array.isArray(pageOptionsDto.causeId)) {
                queryBuilder.andWhere('donation.cause.id IN (:...causeIds)', { causeIds: pageOptionsDto.causeId });
            } else {
                queryBuilder.andWhere('donation.cause.id = :causeId', { causeId: pageOptionsDto.causeId });
            }
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

        if (pageOptionsDto.payment_method) {
            if (Array.isArray(pageOptionsDto.payment_method)) {
                queryBuilder.andWhere('donation.payment_method IN (:...paymentMethods)', {
                    paymentMethods: pageOptionsDto.payment_method,
                });
            } else {
                queryBuilder.andWhere('donation.payment_method = :paymentMethod', {
                    paymentMethod: pageOptionsDto.payment_method,
                });
            }
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
            relations: ['donor', 'campaign', 'cause', 'transaction'],
        });
    }

    async update(id: string, updateDonationDto: UpdateDonationDto): Promise<Donation | null> {
        const { donorId, campaignId, donation_cause, constituency_id, sub_constituency_id, ...donationData } = updateDonationDto;

        const donation = await this.donationsRepository.findOne({
            where: { id },
            relations: ['donor', 'campaign', 'cause', 'constituency', 'sub_constituency'],
        });

        if (!donation) {
            throw new NotFoundException(`Donation with ID ${id} not found`);
        }

        const allowedMethods = ['cash', 'in kind'];
        const currentMethod = donation.payment_method?.toLowerCase() || '';
        if (!allowedMethods.includes(currentMethod)) {
            throw new BadRequestException(
                `Only donations with payment method 'Cash' or 'In Kind' can be edited. This donation has '${donation.payment_method}'.`,
            );
        }

        if (donorId) {
            const donor = await this.donorsRepository.findOneBy({ id: donorId });
            if (!donor) {
                throw new NotFoundException(`Donor with ID ${donorId} not found`);
            }
            donation.donor = donor;
        }

        if (campaignId) {
            const campaign = await this.campaignsRepository.findOneBy({ id: campaignId });
            if (!campaign) {
                throw new NotFoundException(`Campaign with ID ${campaignId} not found`);
            }
            donation.campaign = campaign;
        }

        if (donation_cause) {
            const cause = await this.donationCausesRepository.findOneBy({ name: donation_cause });
            if (!cause) {
                throw new NotFoundException(`Donation Cause '${donation_cause}' not found`);
            }
            donation.cause = cause;
        }

        if (constituency_id) {
            const constituency = await this.constituenciesRepository.findOneBy({ id: constituency_id });
            if (!constituency) {
                throw new NotFoundException(`Constituency with ID ${constituency_id} not found`);
            }
            donation.constituency = constituency;
        }

        if (sub_constituency_id) {
            const subConstituency = await this.subConstituenciesRepository.findOneBy({ id: sub_constituency_id });
            if (!subConstituency) {
                throw new NotFoundException(`Sub-Constituency with ID ${sub_constituency_id} not found`);
            }
            donation.sub_constituency = subConstituency;
        }

        Object.assign(donation, donationData);

        return this.donationsRepository.save(donation);
    }

    async remove(id: string): Promise<void> {
        await this.donationsRepository.softDelete(id);
    }

    async initiateDonation(dto: InitiateDonationDto) {
        // 1. Find or create donor by email
        let donor = await this.donorsRepository.findOneBy({ email: dto.donor.email });

        let constituency: Constituency | null = null;
        if (dto.donor.constituency_id) {
            constituency = await this.constituenciesRepository.findOneBy({ id: dto.donor.constituency_id });
        }

        let subConstituency: SubConstituency | null = null;
        if (dto.donor.sub_constituency_id) {
            subConstituency = await this.subConstituenciesRepository.findOneBy({ id: dto.donor.sub_constituency_id });
        }

        if (!donor) {
            const newDonor = this.donorsRepository.create({
                first_name: dto.donor.first_name,
                last_name: dto.donor.last_name,
                email: dto.donor.email,
                phone: dto.donor.phone,
                // We no longer link constituency to donor
            } as any);

            donor = (await this.donorsRepository.save(newDonor)) as any;
            this.logger.log(`Created new donor: ${(donor as Donor).id} (${(donor as Donor).email})`);
        }

        const safeDonor = donor!;

        // 2. Verify campaign exists
        const campaign = await this.campaignsRepository.findOneBy({ id: dto.campaignId });
        if (!campaign) {
            throw new NotFoundException(`Campaign with ID ${dto.campaignId} not found`);
        }

        // 3. Generate a unique reference for this transaction
        const reference = `DON_${crypto.randomUUID().replace(/-/g, '').substring(0, 16)}`;

        // 4. Create donation record
        const donation = this.donationsRepository.create({
            amount: dto.amount,
            currency: 'GHS',
            payment_method: dto.payment_method,
            donor: safeDonor,
            campaign,
            donation_cause_id: dto.donation_cause || undefined,
            donation_date: new Date(),
            constituency: constituency || undefined,
            sub_constituency: subConstituency || undefined,
        });

        const savedDonation = await this.donationsRepository.save(donation);

        // 5. Create PENDING Transaction record with OUR reference
        const transaction = this.transactionsRepository.create({
            donation: savedDonation,
            reference,
            provider: 'paystack',
            status: 'PENDING',
            idempotency_key: crypto.randomUUID(),
        });

        await this.transactionsRepository.save(transaction);

        this.logger.log(`Donation ${savedDonation.id} created with reference: ${reference}`);

        // 6. Return details for frontend to use with react-paystack
        return {
            donation_id: savedDonation.id,
            reference,
            amount: savedDonation.amount,
            email: dto.email,
        };
    }

    async handleSuccessWebhook(reference: string, provider: string) {
        this.logger.log(`Handling success webhook for reference: ${reference}`);

        const transaction = await this.transactionsRepository.findOne({
            where: { reference },
            relations: ['donation', 'donation.donor'],
        });

        if (!transaction) {
            this.logger.warn(`Transaction not found for reference: ${reference}`);
            return;
        }

        if (transaction.status === 'SUCCESS') {
            this.logger.log(`Transaction ${transaction.id} already processed`);
            return;
        }

        // Update transaction status
        transaction.status = 'SUCCESS';
        await this.transactionsRepository.save(transaction);

        // Push to queue for post-processing
        await this.queueService.send('donation-processing', {
            donationId: transaction.donation?.id,
            amount: transaction.donation?.amount,
            donorId: transaction.donation?.donor?.id,
            email: transaction.donation?.donor?.email,
        });

        this.logger.log(`Transaction ${transaction.id} processed and job queued`);
    }
}
