import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DonationCausesService } from './donation-causes.service';
import { DonationCausesController } from './donation-causes.controller';
import { DonationCause } from './donation-cause.entity';

@Module({
    imports: [TypeOrmModule.forFeature([DonationCause])],
    controllers: [DonationCausesController],
    providers: [DonationCausesService],
    exports: [DonationCausesService], // Exported for use in other modules if needed
})
export class DonationCausesModule { }
