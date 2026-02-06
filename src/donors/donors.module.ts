import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DonorsService } from './donors.service';
import { DonorsController } from './donors.controller';
import { Donor } from './donor.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Donor])],
    providers: [DonorsService],
    controllers: [DonorsController],
})
export class DonorsModule { }
