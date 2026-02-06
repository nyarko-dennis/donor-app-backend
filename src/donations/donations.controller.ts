import { Controller, Get, Post, Body, Param, Delete, UseGuards } from '@nestjs/common';
import { DonationsService } from './donations.service';
import { CreateDonationDto } from './dto/create-donation.dto';
import { Donation } from './donation.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../users/user.entity';

@Controller('donations')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DonationsController {
    constructor(private readonly donationsService: DonationsService) { }

    @Post()
    @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
    create(@Body() createDonationDto: CreateDonationDto): Promise<Donation> {
        return this.donationsService.create(createDonationDto);
    }

    @Get()
    @Roles(UserRole.STAKEHOLDER, UserRole.ADMIN, UserRole.SUPER_ADMIN)
    findAll(): Promise<Donation[]> {
        return this.donationsService.findAll();
    }

    @Get(':id')
    @Roles(UserRole.STAKEHOLDER, UserRole.ADMIN, UserRole.SUPER_ADMIN)
    findOne(@Param('id') id: string): Promise<Donation | null> {
        return this.donationsService.findOne(id);
    }

    @Delete(':id')
    @Roles(UserRole.SUPER_ADMIN)
    remove(@Param('id') id: string): Promise<void> {
        return this.donationsService.remove(id);
    }
}
