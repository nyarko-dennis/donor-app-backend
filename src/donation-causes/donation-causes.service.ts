import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DonationCause } from './donation-cause.entity';
import { CreateDonationCauseDto } from './dto/create-donation-cause.dto';
import { PageOptionsDto } from '../common/dto/page-options.dto';
import { DonationCausesPageOptionsDto } from './dto/donation-causes-page-options.dto';
import { PageMetaDto } from '../common/dto/page-meta.dto';
import { PageDto } from '../common/dto/page.dto';

@Injectable()
export class DonationCausesService {
    constructor(
        @InjectRepository(DonationCause)
        private donationCausesRepository: Repository<DonationCause>,
    ) { }

    create(createDonationCauseDto: CreateDonationCauseDto): Promise<DonationCause> {
        const cause = this.donationCausesRepository.create(createDonationCauseDto);
        return this.donationCausesRepository.save(cause);
    }

    async findAll(pageOptionsDto: DonationCausesPageOptionsDto): Promise<PageDto<DonationCause>> {
        const queryBuilder = this.donationCausesRepository.createQueryBuilder('donation_cause');

        if (pageOptionsDto.search) {
            queryBuilder.where('donation_cause.name ILIKE :search OR donation_cause.description ILIKE :search', {
                search: `%${pageOptionsDto.search}%`,
            });
        }

        if (pageOptionsDto.isActive !== undefined) {
            queryBuilder.andWhere('donation_cause.is_active = :isActive', { isActive: pageOptionsDto.isActive });
        }

        queryBuilder
            .orderBy(`donation_cause.${pageOptionsDto.sortBy || 'created_at'}`, pageOptionsDto.order)
            .skip(pageOptionsDto.skip)
            .take(pageOptionsDto.take);

        const itemCount = await queryBuilder.getCount();
        const { entities } = await queryBuilder.getRawAndEntities();

        const pageMetaDto = new PageMetaDto({ itemCount, pageOptionsDto });

        return new PageDto(entities, pageMetaDto);
    }

    async findOne(id: string): Promise<DonationCause> {
        const cause = await this.donationCausesRepository.findOneBy({ id });
        if (!cause) {
            throw new NotFoundException(`Donation Cause with ID ${id} not found`);
        }
        return cause;
    }

    async update(id: string, updateDonationCauseDto: Partial<CreateDonationCauseDto>): Promise<DonationCause> {
        const cause = await this.findOne(id);
        Object.assign(cause, updateDonationCauseDto);
        return this.donationCausesRepository.save(cause);
    }

    async remove(id: string): Promise<void> {
        await this.donationCausesRepository.delete(id);
    }
}
