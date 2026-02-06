import { Controller, Get, Post, Body, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { DonationsService } from './donations.service';
import { CreateDonationDto } from './dto/create-donation.dto';
import { DonationResponseDto } from './dto/donation-response.dto';
import { Donation } from './donation.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../users/user.entity';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PageOptionsDto } from '../common/dto/page-options.dto';
import { PageDto } from '../common/dto/page.dto';

@ApiTags('Donations')
@ApiBearerAuth()
@Controller('donations')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DonationsController {
    constructor(private readonly donationsService: DonationsService) { }

    @Post()
    @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
    @ApiOperation({ summary: 'Create a new donation' })
    @ApiResponse({ status: 201, description: 'The donation has been successfully created.', type: DonationResponseDto })
    async create(@Body() createDonationDto: CreateDonationDto): Promise<DonationResponseDto> {
        const donation = await this.donationsService.create(createDonationDto);
        return new DonationResponseDto(donation);
    }

    @Get()
    @Roles(UserRole.STAKEHOLDER, UserRole.ADMIN, UserRole.SUPER_ADMIN)
    @ApiOperation({ summary: 'Get all donations with pagination and search' })
    @ApiResponse({ status: 200, description: 'Return all donations.', type: PageDto<DonationResponseDto> })
    async findAll(@Query() pageOptionsDto: PageOptionsDto): Promise<PageDto<DonationResponseDto>> {
        const page = await this.donationsService.findAll(pageOptionsDto);
        return new PageDto(
            page.data.map((donation) => new DonationResponseDto(donation)),
            page.meta,
        );
    }

    @Get(':id')
    @Roles(UserRole.STAKEHOLDER, UserRole.ADMIN, UserRole.SUPER_ADMIN)
    @ApiOperation({ summary: 'Get a donation by ID' })
    @ApiResponse({ status: 200, description: 'Return the donation.', type: DonationResponseDto })
    async findOne(@Param('id') id: string): Promise<DonationResponseDto | null> {
        const donation = await this.donationsService.findOne(id);
        return donation ? new DonationResponseDto(donation) : null;
    }

    @Delete(':id')
    @Roles(UserRole.SUPER_ADMIN)
    @ApiOperation({ summary: 'Delete a donation' })
    @ApiResponse({ status: 200, description: 'The donation has been successfully deleted.' })
    remove(@Param('id') id: string): Promise<void> {
        return this.donationsService.remove(id);
    }
}
