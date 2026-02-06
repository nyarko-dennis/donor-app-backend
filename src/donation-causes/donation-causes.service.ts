import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DonationCause } from './donation-cause.entity';
import { CreateDonationCauseDto } from './dto/create-donation-cause.dto';

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

    findAll(): Promise<DonationCause[]> {
        return this.donationCausesRepository.find({
            order: { name: 'ASC' }
        });
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
