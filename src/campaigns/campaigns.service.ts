import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Campaign } from './campaign.entity';
import { CreateCampaignDto } from './dto/create-campaign.dto';

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

    findAll(): Promise<Campaign[]> {
        return this.campaignsRepository.find();
    }

    findOne(id: string): Promise<Campaign | null> {
        return this.campaignsRepository.findOneBy({ id });
    }

    async remove(id: string): Promise<void> {
        await this.campaignsRepository.delete(id);
    }
}
