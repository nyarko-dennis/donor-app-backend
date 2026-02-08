import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Constituency } from './constituency.entity';
import { SubConstituency } from './sub-constituency.entity';
import { CreateConstituencyDto } from './dto/create-constituency.dto';
import { UpdateConstituencyDto } from './dto/update-constituency.dto';
import { CreateSubConstituencyDto } from './dto/create-sub-constituency.dto';
import { UpdateSubConstituencyDto } from './dto/update-sub-constituency.dto';

@Injectable()
export class ConstituenciesService {
    constructor(
        @InjectRepository(Constituency)
        private constituenciesRepository: Repository<Constituency>,
        @InjectRepository(SubConstituency)
        private subConstituenciesRepository: Repository<SubConstituency>,
    ) { }

    // Constituency CRUD
    async create(createConstituencyDto: CreateConstituencyDto): Promise<Constituency> {
        const constituency = this.constituenciesRepository.create(createConstituencyDto);
        return this.constituenciesRepository.save(constituency);
    }

    async findAll(): Promise<Constituency[]> {
        return this.constituenciesRepository.find({
            relations: ['sub_constituencies'],
            order: { name: 'ASC' }
        });
    }

    async findOne(id: string): Promise<Constituency> {
        const constituency = await this.constituenciesRepository.findOne({
            where: { id },
            relations: ['sub_constituencies']
        });
        if (!constituency) {
            throw new NotFoundException(`Constituency with ID ${id} not found`);
        }
        return constituency;
    }

    async update(id: string, updateConstituencyDto: UpdateConstituencyDto): Promise<Constituency> {
        const constituency = await this.findOne(id);
        Object.assign(constituency, updateConstituencyDto);
        return this.constituenciesRepository.save(constituency);
    }

    async remove(id: string): Promise<void> {
        const result = await this.constituenciesRepository.delete(id);
        if (result.affected === 0) {
            throw new NotFoundException(`Constituency with ID ${id} not found`);
        }
    }

    // Sub-Constituency CRUD
    async createSubConstituency(createSubConstituencyDto: CreateSubConstituencyDto): Promise<SubConstituency> {
        const constituency = await this.findOne(createSubConstituencyDto.constituency_id);
        const subConstituency = this.subConstituenciesRepository.create({
            ...createSubConstituencyDto,
            constituency
        });
        return this.subConstituenciesRepository.save(subConstituency);
    }

    async findSubConstituency(id: string): Promise<SubConstituency> {
        const subConstituency = await this.subConstituenciesRepository.findOneBy({ id });
        if (!subConstituency) {
            throw new NotFoundException(`SubConstituency with ID ${id} not found`);
        }
        return subConstituency;
    }

    async updateSubConstituency(id: string, updateSubConstituencyDto: UpdateSubConstituencyDto): Promise<SubConstituency> {
        const subConstituency = await this.findSubConstituency(id);
        if (updateSubConstituencyDto.constituency_id) {
            const constituency = await this.findOne(updateSubConstituencyDto.constituency_id);
            subConstituency.constituency = constituency;
        }
        Object.assign(subConstituency, updateSubConstituencyDto);
        return this.subConstituenciesRepository.save(subConstituency);
    }

    async removeSubConstituency(id: string): Promise<void> {
        const result = await this.subConstituenciesRepository.delete(id);
        if (result.affected === 0) {
            throw new NotFoundException(`SubConstituency with ID ${id} not found`);
        }
    }
}
