import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Donation } from './donation.entity';
import { CreateDonationDto } from './dto/create-donation.dto';

@Injectable()
export class DonationsService {
    constructor(
        @InjectRepository(Donation)
        private donationsRepository: Repository<Donation>,
    ) { }

    create(createDonationDto: CreateDonationDto): Promise<Donation> {
        const donation = this.donationsRepository.create(createDonationDto);
        return this.donationsRepository.save(donation);
    }

    findAll(): Promise<Donation[]> {
        return this.donationsRepository.find({ relations: ['donor', 'campaign'] });
    }

    findOne(id: string): Promise<Donation | null> {
        return this.donationsRepository.findOne({
            where: { id },
            relations: ['donor', 'campaign'],
        });
    }

    async remove(id: string): Promise<void> {
        await this.donationsRepository.delete(id);
    }
}
