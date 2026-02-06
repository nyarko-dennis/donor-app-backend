import { Controller, Get, Post, Body, Param, Delete, UseGuards } from '@nestjs/common';
import { DonorsService } from './donors.service';
import { CreateDonorDto } from './dto/create-donor.dto';
import { Donor } from './donor.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../users/user.entity';

@Controller('donors')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DonorsController {
    constructor(private readonly donorsService: DonorsService) { }

    @Post()
    @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
    create(@Body() createDonorDto: CreateDonorDto): Promise<Donor> {
        return this.donorsService.create(createDonorDto);
    }

    @Get()
    @Roles(UserRole.STAKEHOLDER, UserRole.ADMIN, UserRole.SUPER_ADMIN)
    findAll(): Promise<Donor[]> {
        return this.donorsService.findAll();
    }

    @Get(':id')
    @Roles(UserRole.STAKEHOLDER, UserRole.ADMIN, UserRole.SUPER_ADMIN)
    findOne(@Param('id') id: string): Promise<Donor | null> {
        return this.donorsService.findOne(id);
    }

    @Delete(':id')
    @Roles(UserRole.SUPER_ADMIN)
    remove(@Param('id') id: string): Promise<void> {
        return this.donorsService.remove(id);
    }
}
