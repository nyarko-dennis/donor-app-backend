import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Class } from './class.entity';
import { SubConstituency } from '../constituencies/sub-constituency.entity';
import { CreateClassDto } from './dto/create-class.dto';
import { UpdateClassDto } from './dto/update-class.dto';
import { ClassesPageOptionsDto } from './dto/classes-page-options.dto';
import { PageMetaDto } from '../common/dto/page-meta.dto';
import { PageDto } from '../common/dto/page.dto';

@Injectable()
export class ClassesService {
  constructor(
    @InjectRepository(Class)
    private classesRepository: Repository<Class>,
    @InjectRepository(SubConstituency)
    private subConstituenciesRepository: Repository<SubConstituency>,
  ) {}

  async create(createClassDto: CreateClassDto): Promise<Class> {
    const subConstituency = await this.subConstituenciesRepository.findOne({
      where: { id: createClassDto.sub_constituency_id },
    });
    if (!subConstituency) {
      throw new NotFoundException(
        `SubConstituency with ID ${createClassDto.sub_constituency_id} not found`,
      );
    }

    const newClass = this.classesRepository.create({
      ...createClassDto,
      sub_constituency: subConstituency,
    });
    return this.classesRepository.save(newClass);
  }

  async findAll(
    pageOptionsDto: ClassesPageOptionsDto,
  ): Promise<PageDto<Class>> {
    const queryBuilder = this.classesRepository.createQueryBuilder('class');

    if (pageOptionsDto.search) {
      queryBuilder.where(
        'class.name ILIKE :search OR class.description ILIKE :search',
        {
          search: `%${pageOptionsDto.search}%`,
        },
      );
    }

    if (pageOptionsDto.subConstituencyId) {
      if (Array.isArray(pageOptionsDto.subConstituencyId)) {
        queryBuilder.andWhere(
          'class.sub_constituency_id IN (:...subConstituencyIds)',
          {
            subConstituencyIds: pageOptionsDto.subConstituencyId,
          },
        );
      } else {
        queryBuilder.andWhere(
          'class.sub_constituency_id = :subConstituencyId',
          {
            subConstituencyId: pageOptionsDto.subConstituencyId,
          },
        );
      }
    }

    queryBuilder
      .leftJoinAndSelect('class.sub_constituency', 'sub_constituency')
      .orderBy(`class.${pageOptionsDto.sortBy || 'name'}`, pageOptionsDto.order)
      .skip(pageOptionsDto.skip)
      .take(pageOptionsDto.take);

    const itemCount = await queryBuilder.getCount();
    const { entities } = await queryBuilder.getRawAndEntities();

    const pageMetaDto = new PageMetaDto({ itemCount, pageOptionsDto });

    return new PageDto(entities, pageMetaDto);
  }

  async findOne(id: string): Promise<Class> {
    const classEntity = await this.classesRepository.findOne({
      where: { id },
      relations: ['sub_constituency'],
    });
    if (!classEntity) {
      throw new NotFoundException(`Class with ID ${id} not found`);
    }
    return classEntity;
  }

  async update(id: string, updateClassDto: UpdateClassDto): Promise<Class> {
    const classEntity = await this.findOne(id);

    if (updateClassDto.sub_constituency_id) {
      const subConstituency = await this.subConstituenciesRepository.findOne({
        where: { id: updateClassDto.sub_constituency_id },
      });
      if (!subConstituency) {
        throw new NotFoundException(
          `SubConstituency with ID ${updateClassDto.sub_constituency_id} not found`,
        );
      }
      classEntity.sub_constituency = subConstituency;
    }

    Object.assign(classEntity, updateClassDto);
    return this.classesRepository.save(classEntity);
  }

  async remove(id: string): Promise<void> {
    const result = await this.classesRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Class with ID ${id} not found`);
    }
  }
}
