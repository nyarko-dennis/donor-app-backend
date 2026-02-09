import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { DonationCausesService } from './donation-causes.service';
import { CreateDonationCauseDto } from './dto/create-donation-cause.dto';
import { DonationCauseResponseDto } from './dto/donation-cause-response.dto';
import { PageOptionsDto } from '../common/dto/page-options.dto';
import { DonationCausesPageOptionsDto } from './dto/donation-causes-page-options.dto';
import { PageDto } from '../common/dto/page.dto';
import { ApiTags, ApiResponse } from '@nestjs/swagger';

@ApiTags('Donation Causes')
@Controller('donation-causes')
export class DonationCausesController {
    constructor(private readonly donationCausesService: DonationCausesService) { }

    @Post()
    @ApiResponse({ status: 201, description: 'The record has been successfully created.', type: DonationCauseResponseDto })
    create(@Body() createDonationCauseDto: CreateDonationCauseDto) {
        return this.donationCausesService.create(createDonationCauseDto);
    }

    @Get()
    @ApiResponse({ status: 200, description: 'List of all donation causes.', type: PageDto<DonationCauseResponseDto> })
    findAll(@Query() pageOptionsDto: DonationCausesPageOptionsDto) {
        return this.donationCausesService.findAll(pageOptionsDto);
    }

    @Get(':id')
    @ApiResponse({ status: 200, description: 'The donation cause.', type: DonationCauseResponseDto })
    @ApiResponse({ status: 404, description: 'Donation cause not found.' })
    findOne(@Param('id') id: string) {
        return this.donationCausesService.findOne(id);
    }

    @Patch(':id')
    @ApiResponse({ status: 200, description: 'The updated donation cause.', type: DonationCauseResponseDto })
    update(@Param('id') id: string, @Body() updateDonationCauseDto: Partial<CreateDonationCauseDto>) {
        return this.donationCausesService.update(id, updateDonationCauseDto);
    }

    @Delete(':id')
    @ApiResponse({ status: 200, description: 'The record has been successfully deleted.' })
    remove(@Param('id') id: string) {
        return this.donationCausesService.remove(id);
    }
}
