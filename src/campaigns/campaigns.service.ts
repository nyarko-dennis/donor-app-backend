import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Campaign } from './campaign.entity';
import { CreateCampaignDto } from './dto/create-campaign.dto';
import { PageOptionsDto } from '../common/dto/page-options.dto';
import { CampaignsPageOptionsDto } from './dto/campaigns-page-options.dto';
import { PageDto } from '../common/dto/page.dto';
import { PageMetaDto } from '../common/dto/page-meta.dto';

@Injectable()
export class CampaignsService {
    constructor(
        @InjectRepository(Campaign)
        private campaignsRepository: Repository<Campaign>,
    ) { }

    create(createCampaignDto: CreateCampaignDto): Promise<Campaign> {
        const campaign = this.campaignsRepository.create(createCampaignDto);
        return this.campaignsRepository.save(campaign);
    }

    async findAll(pageOptionsDto: CampaignsPageOptionsDto): Promise<PageDto<Campaign>> {
        const queryBuilder = this.campaignsRepository.createQueryBuilder('campaign');

        if (pageOptionsDto.search) {
            queryBuilder.where('(campaign.name ILIKE :search OR campaign.description ILIKE :search)', {
                search: `%${pageOptionsDto.search}%`,
            });
        }

        if (pageOptionsDto.status) {
            if (Array.isArray(pageOptionsDto.status)) {
                queryBuilder.andWhere('campaign.status IN (:...statuses)', { statuses: pageOptionsDto.status });
            } else {
                queryBuilder.andWhere('campaign.status = :status', { status: pageOptionsDto.status });
            }
        }

        if (pageOptionsDto.minGoal) {
            queryBuilder.andWhere('campaign.goal_amount >= :minGoal', { minGoal: pageOptionsDto.minGoal });
        }

        if (pageOptionsDto.maxGoal) {
            queryBuilder.andWhere('campaign.goal_amount <= :maxGoal', { maxGoal: pageOptionsDto.maxGoal });
        }

        queryBuilder
            .orderBy(`campaign.${pageOptionsDto.sortBy || 'created_at'}`, pageOptionsDto.order)
            .skip(pageOptionsDto.skip)
            .take(pageOptionsDto.take);

        const itemCount = await queryBuilder.getCount();
        const { entities } = await queryBuilder.getRawAndEntities();

        const pageMetaDto = new PageMetaDto({ itemCount, pageOptionsDto });

        return new PageDto(entities, pageMetaDto);
    }

    findOne(id: string): Promise<Campaign | null> {
        return this.campaignsRepository.findOneBy({ id });
    }

    async remove(id: string): Promise<void> {
        await this.campaignsRepository.delete(id);
    }
}
