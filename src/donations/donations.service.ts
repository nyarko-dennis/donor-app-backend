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
            .leftJoinAndSelect('donation.cause', 'cause')
            .leftJoinAndSelect('donation.transaction', 'transaction');

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
            relations: ['donor', 'campaign', 'cause', 'transaction'],
        });
    }

    async update(id: string, updateDonationDto: UpdateDonationDto) {
        await this.donationsRepository.update(id, updateDonationDto);
        return this.donationsRepository.findOne({ where: { id } });
    }

    async remove(id: string): Promise<void> {
        await this.donationsRepository.delete(id);
    }

    async initiateDonation(dto: InitiateDonationDto) {
        // 1. Find or create donor by email
        let donor = await this.donorsRepository.findOneBy({ email: dto.donor.email });

        if (!donor) {
            let constituencyName: string | undefined;
            if (dto.donor.constituency_id) {
                const c = await this.constituenciesRepository.findOneBy({ id: dto.donor.constituency_id });
                constituencyName = c?.name;
            }

            let subConstituencyName: string | undefined;
            if (dto.donor.sub_constituency_id) {
                const sc = await this.subConstituenciesRepository.findOneBy({ id: dto.donor.sub_constituency_id });
                subConstituencyName = sc?.name;
            }

            const newDonor = this.donorsRepository.create({
                first_name: dto.donor.first_name,
                last_name: dto.donor.last_name,
                email: dto.donor.email,
                phone: dto.donor.phone,
                constituency_id: dto.donor.constituency_id,
                sub_constituency_id: dto.donor.sub_constituency_id,
                constituency: constituencyName,
                sub_constituency: subConstituencyName,
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
