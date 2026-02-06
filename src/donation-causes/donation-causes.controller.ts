import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { DonationCausesService } from './donation-causes.service';
import { CreateDonationCauseDto } from './dto/create-donation-cause.dto';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Donation Causes')
@Controller('donation-causes')
export class DonationCausesController {
    constructor(private readonly donationCausesService: DonationCausesService) { }

    @Post()
    create(@Body() createDonationCauseDto: CreateDonationCauseDto) {
        return this.donationCausesService.create(createDonationCauseDto);
    }

    @Get()
    findAll() {
        return this.donationCausesService.findAll();
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.donationCausesService.findOne(id);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() updateDonationCauseDto: Partial<CreateDonationCauseDto>) {
        return this.donationCausesService.update(id, updateDonationCauseDto);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.donationCausesService.remove(id);
    }
}
