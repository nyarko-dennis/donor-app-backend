import { Controller, Get, Post, Body, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { CampaignsService } from './campaigns.service';
import { CreateCampaignDto } from './dto/create-campaign.dto';
import { CampaignResponseDto } from './dto/campaign-response.dto';
import { Campaign } from './campaign.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../users/user.entity';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PageOptionsDto } from '../common/dto/page-options.dto';
import { CampaignsPageOptionsDto } from './dto/campaigns-page-options.dto';
import { PageDto } from '../common/dto/page.dto';

@ApiTags('Campaigns')
@ApiBearerAuth()
@Controller('campaigns')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CampaignsController {
    constructor(private readonly campaignsService: CampaignsService) { }

    @Post()
    @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
    @ApiOperation({ summary: 'Create a new campaign' })
    @ApiResponse({ status: 201, description: 'The campaign has been successfully created.', type: CampaignResponseDto })
    async create(@Body() createCampaignDto: CreateCampaignDto): Promise<CampaignResponseDto> {
        const campaign = await this.campaignsService.create(createCampaignDto);
        return new CampaignResponseDto(campaign);
    }

    @Get()
    @Roles(UserRole.STAKEHOLDER, UserRole.ADMIN, UserRole.SUPER_ADMIN)
    @ApiOperation({ summary: 'Get all campaigns with pagination and search' })
    @ApiResponse({ status: 200, description: 'Return all campaigns.', type: PageDto<CampaignResponseDto> })
    async findAll(@Query() pageOptionsDto: CampaignsPageOptionsDto): Promise<PageDto<CampaignResponseDto>> {
        const page = await this.campaignsService.findAll(pageOptionsDto);
        return new PageDto(
            page.data.map(campaign => new CampaignResponseDto(campaign)),
            page.meta
        );
    }

    @Get(':id')
    @Roles(UserRole.STAKEHOLDER, UserRole.ADMIN, UserRole.SUPER_ADMIN)
    @ApiOperation({ summary: 'Get a campaign by ID' })
    @ApiResponse({ status: 200, description: 'Return the campaign.', type: CampaignResponseDto })
    async findOne(@Param('id') id: string): Promise<CampaignResponseDto | null> {
        const campaign = await this.campaignsService.findOne(id);
        return campaign ? new CampaignResponseDto(campaign) : null;
    }

    @Delete(':id')
    @Roles(UserRole.SUPER_ADMIN)
    @ApiOperation({ summary: 'Delete a campaign' })
    @ApiResponse({ status: 200, description: 'The campaign has been successfully deleted.' })
    remove(@Param('id') id: string): Promise<void> {
        return this.campaignsService.remove(id);
    }
}
