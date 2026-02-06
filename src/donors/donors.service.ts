import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Donor } from './donor.entity';
import { CreateDonorDto } from './dto/create-donor.dto';
import { PageOptionsDto } from '../common/dto/page-options.dto';
import { PageDto } from '../common/dto/page.dto';
import { PageMetaDto } from '../common/dto/page-meta.dto';

@Injectable()
export class DonorsService {
    constructor(
        @InjectRepository(Donor)
        private donorsRepository: Repository<Donor>,
    ) { }

    create(createDonorDto: CreateDonorDto): Promise<Donor> {
        const donor = this.donorsRepository.create(createDonorDto);
        return this.donorsRepository.save(donor);
    }

    async findAll(pageOptionsDto: PageOptionsDto): Promise<PageDto<Donor>> {
        const queryBuilder = this.donorsRepository.createQueryBuilder('donor');

        if (pageOptionsDto.search) {
            queryBuilder.where(
                'donor.first_name ILIKE :search OR donor.last_name ILIKE :search OR donor.email ILIKE :search',
                { search: `%${pageOptionsDto.search}%` },
            );
        }

        queryBuilder
            .orderBy('donor.date_joined', pageOptionsDto.order)
            .skip(pageOptionsDto.skip)
            .take(pageOptionsDto.take);

        const itemCount = await queryBuilder.getCount();
        const { entities } = await queryBuilder.getRawAndEntities();

        const pageMetaDto = new PageMetaDto({ itemCount, pageOptionsDto });

        return new PageDto(entities, pageMetaDto);
    }

    findOne(id: string): Promise<Donor | null> {
        return this.donorsRepository.findOneBy({ id });
    }

    async remove(id: string): Promise<void> {
        await this.donorsRepository.delete(id);
    }
}
