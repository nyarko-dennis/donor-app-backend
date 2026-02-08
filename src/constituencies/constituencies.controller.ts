import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ConstituenciesService } from './constituencies.service';
import { CreateConstituencyDto } from './dto/create-constituency.dto';
import { UpdateConstituencyDto } from './dto/update-constituency.dto';
import { CreateSubConstituencyDto } from './dto/create-sub-constituency.dto';
import { UpdateSubConstituencyDto } from './dto/update-sub-constituency.dto';
import { ConstituencyResponseDto } from './dto/constituency-response.dto';
import { SubConstituencyResponseDto } from './dto/sub-constituency-response.dto';
import { ApiTags, ApiResponse } from '@nestjs/swagger';

@ApiTags('Constituencies')
@Controller('constituencies')
export class ConstituenciesController {
    constructor(private readonly constituenciesService: ConstituenciesService) { }

    @Post()
    @ApiResponse({ status: 201, description: 'Constituency created.', type: ConstituencyResponseDto })
    create(@Body() createConstituencyDto: CreateConstituencyDto) {
        return this.constituenciesService.create(createConstituencyDto);
    }

    @Get()
    @ApiResponse({ status: 200, description: 'List all constituencies.', type: [ConstituencyResponseDto] })
    findAll() {
        return this.constituenciesService.findAll();
    }

    @Get(':id')
    @ApiResponse({ status: 200, description: 'Get one constituency.', type: ConstituencyResponseDto })
    findOne(@Param('id') id: string) {
        return this.constituenciesService.findOne(id);
    }

    @Patch(':id')
    @ApiResponse({ status: 200, description: 'Update constituency.', type: ConstituencyResponseDto })
    update(@Param('id') id: string, @Body() updateConstituencyDto: UpdateConstituencyDto) {
        return this.constituenciesService.update(id, updateConstituencyDto);
    }

    @Delete(':id')
    @ApiResponse({ status: 200, description: 'Delete constituency.' })
    remove(@Param('id') id: string) {
        return this.constituenciesService.remove(id);
    }

    // Sub-Constituencies Endpoints
    @Post(':id/sub-constituencies')
    @ApiResponse({ status: 201, description: 'Sub-Constituency created.', type: SubConstituencyResponseDto })
    createSubConstituency(@Param('id') constituencyId: string, @Body() createSubConstituencyDto: CreateSubConstituencyDto) {
        // Ensure the ID in the URL matches the DTO or override it
        createSubConstituencyDto.constituency_id = constituencyId;
        return this.constituenciesService.createSubConstituency(createSubConstituencyDto);
    }

    @Patch('sub-constituencies/:id')
    @ApiResponse({ status: 200, description: 'Update sub-constituency.', type: SubConstituencyResponseDto })
    updateSubConstituency(@Param('id') id: string, @Body() updateSubConstituencyDto: UpdateSubConstituencyDto) {
        return this.constituenciesService.updateSubConstituency(id, updateSubConstituencyDto);
    }

    @Delete('sub-constituencies/:id')
    @ApiResponse({ status: 200, description: 'Delete sub-constituency.' })
    removeSubConstituency(@Param('id') id: string) {
        return this.constituenciesService.removeSubConstituency(id);
    }
}
