import { Controller, Get, Post, Body, Param, Delete, UseGuards } from '@nestjs/common';
import { CampaignsService } from './campaigns.service';
import { CreateCampaignDto } from './dto/create-campaign.dto';
import { Campaign } from './campaign.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../users/user.entity';

@Controller('campaigns')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CampaignsController {
    constructor(private readonly campaignsService: CampaignsService) { }

    @Post()
    @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
    create(@Body() createCampaignDto: CreateCampaignDto): Promise<Campaign> {
        return this.campaignsService.create(createCampaignDto);
    }

    @Get()
    @Roles(UserRole.STAKEHOLDER, UserRole.ADMIN, UserRole.SUPER_ADMIN)
    findAll(): Promise<Campaign[]> {
        return this.campaignsService.findAll();
    }

    @Get(':id')
    @Roles(UserRole.STAKEHOLDER, UserRole.ADMIN, UserRole.SUPER_ADMIN)
    findOne(@Param('id') id: string): Promise<Campaign | null> {
        return this.campaignsService.findOne(id);
    }

    @Delete(':id')
    @Roles(UserRole.SUPER_ADMIN)
    remove(@Param('id') id: string): Promise<void> {
        return this.campaignsService.remove(id);
    }
}
