import { Injectable, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, QueryFailedError } from 'typeorm';
import { Donor } from './donor.entity';
import { CreateDonorDto } from './dto/create-donor.dto';
import { PageOptionsDto } from '../common/dto/page-options.dto';
import { DonorsPageOptionsDto } from './dto/donors-page-options.dto';
import { PageDto } from '../common/dto/page.dto';
import { PageMetaDto } from '../common/dto/page-meta.dto';

@Injectable()
export class DonorsService {
  constructor(
    @InjectRepository(Donor)
    private donorsRepository: Repository<Donor>,
  ) { }

  async create(createDonorDto: CreateDonorDto): Promise<Donor> {
    const donor = this.donorsRepository.create(createDonorDto);
    try {
      return await this.donorsRepository.save(donor);
    } catch (error) {
      if (
        error instanceof QueryFailedError &&
        (error as any).code === '23505'
      ) {
        throw new ConflictException(
          `A donor with the email "${createDonorDto.email}" already exists.`,
        );
      }
      throw error;
    }
  }

  async findAll(pageOptionsDto: DonorsPageOptionsDto): Promise<PageDto<Donor>> {
    const queryBuilder = this.donorsRepository.createQueryBuilder('donor');

    if (pageOptionsDto.search) {
      const search = pageOptionsDto.search.trim();
      queryBuilder.where(
        `(donor.first_name ILIKE :search OR donor.last_name ILIKE :search OR donor.email ILIKE :search OR donor.phone ILIKE :search OR CONCAT(donor.first_name, ' ', donor.last_name) ILIKE :search)`,
        { search: `%${search}%` },
      );
    }

    if (pageOptionsDto.constituencyId) {
      if (Array.isArray(pageOptionsDto.constituencyId)) {
        queryBuilder.andWhere(
          'donor.constituency_id IN (:...constituencyIds)',
          {
            constituencyIds: pageOptionsDto.constituencyId,
          },
        );
      } else {
        queryBuilder.andWhere('donor.constituency_id = :constituencyId', {
          constituencyId: pageOptionsDto.constituencyId,
        });
      }
    }

    if (pageOptionsDto.subConstituencyId) {
      if (Array.isArray(pageOptionsDto.subConstituencyId)) {
        queryBuilder.andWhere(
          'donor.sub_constituency_id IN (:...subConstituencyIds)',
          {
            subConstituencyIds: pageOptionsDto.subConstituencyId,
          },
        );
      } else {
        queryBuilder.andWhere(
          'donor.sub_constituency_id = :subConstituencyId',
          {
            subConstituencyId: pageOptionsDto.subConstituencyId,
          },
        );
      }
    }

    queryBuilder
      .orderBy(
        `donor.${pageOptionsDto.sortBy || 'date_joined'}`,
        pageOptionsDto.order,
      )
      .skip(pageOptionsDto.skip)
      .take(pageOptionsDto.take);

    const itemCount = await queryBuilder.getCount();
    const { entities } = await queryBuilder.getRawAndEntities();

    const pageMetaDto = new PageMetaDto({ itemCount, pageOptionsDto });

    return new PageDto(entities, pageMetaDto);
  }

  async findOne(id: string): Promise<Donor | null> {
    return this.donorsRepository.findOne({
      where: { id },
      relations: [
        'donations',
        'donations.cause',
        'donations.campaign',
        'donations.transaction',
      ],
      order: {
        donations: {
          donation_date: 'DESC',
        },
      },
    });
  }

  async remove(id: string): Promise<void> {
    await this.donorsRepository.delete(id);
  }
}
