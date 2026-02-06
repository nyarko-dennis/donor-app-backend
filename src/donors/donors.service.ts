import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Donor } from './donor.entity';
import { CreateDonorDto } from './dto/create-donor.dto';

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

    findAll(): Promise<Donor[]> {
        return this.donorsRepository.find();
    }

    findOne(id: string): Promise<Donor | null> {
        return this.donorsRepository.findOneBy({ id });
    }

    async remove(id: string): Promise<void> {
        await this.donorsRepository.delete(id);
    }
}
