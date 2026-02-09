import { Controller, Get, Post, Body, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { DonorsService } from './donors.service';
import { CreateDonorDto } from './dto/create-donor.dto';
import { DonorResponseDto } from './dto/donor-response.dto';
import { Donor } from './donor.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../users/user.entity';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PageOptionsDto } from '../common/dto/page-options.dto';
import { DonorsPageOptionsDto } from './dto/donors-page-options.dto';
import { PageDto } from '../common/dto/page.dto';

@ApiTags('Donors')
@ApiBearerAuth()
@Controller('donors')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DonorsController {
    constructor(private readonly donorsService: DonorsService) { }

    @Post()
    @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
    @ApiOperation({ summary: 'Create a new donor' })
    @ApiResponse({ status: 201, description: 'The donor has been successfully created.', type: DonorResponseDto })
    async create(@Body() createDonorDto: CreateDonorDto): Promise<DonorResponseDto> {
        const donor = await this.donorsService.create(createDonorDto);
        return new DonorResponseDto(donor);
    }

    @Get()
    @Roles(UserRole.STAKEHOLDER, UserRole.ADMIN, UserRole.SUPER_ADMIN)
    @ApiOperation({ summary: 'Get all donors with pagination and search' })
    @ApiResponse({ status: 200, description: 'Return all donors.', type: PageDto<DonorResponseDto> })
    async findAll(@Query() pageOptionsDto: DonorsPageOptionsDto): Promise<PageDto<DonorResponseDto>> {
        const page = await this.donorsService.findAll(pageOptionsDto);
        return new PageDto(
            page.data.map((donor) => new DonorResponseDto(donor)),
            page.meta,
        );
    }

    @Get(':id')
    @Roles(UserRole.STAKEHOLDER, UserRole.ADMIN, UserRole.SUPER_ADMIN)
    @ApiOperation({ summary: 'Get a donor by ID' })
    @ApiResponse({ status: 200, description: 'Return the donor.', type: DonorResponseDto })
    async findOne(@Param('id') id: string): Promise<DonorResponseDto | null> {
        const donor = await this.donorsService.findOne(id);
        return donor ? new DonorResponseDto(donor) : null;
    }

    @Delete(':id')
    @Roles(UserRole.SUPER_ADMIN)
    @ApiOperation({ summary: 'Delete a donor' })
    @ApiResponse({ status: 200, description: 'The donor has been successfully deleted.' })
    remove(@Param('id') id: string): Promise<void> {
        return this.donorsService.remove(id);
    }
}
