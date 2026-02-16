
import { Controller, Post, Body, Res, StreamableFile } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ExportsService } from './exports.service';
import { ExportRequestDto } from './dto/export-request.dto';
import { Response } from 'express';

@ApiTags('Exports')
@Controller('exports')
export class ExportsController {
    constructor(private readonly exportsService: ExportsService) { }

    @Post()
    @ApiOperation({ summary: 'Export data to CSV or XLSX' })
    @ApiResponse({ status: 200, description: 'File stream' })
    async exportData(@Body() request: ExportRequestDto, @Res({ passthrough: true }) res: Response): Promise<StreamableFile> {
        return this.exportsService.exportData(request);
    }
}
