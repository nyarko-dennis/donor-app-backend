
import { IsEnum, IsOptional, ValidateNested, IsString, IsArray, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum ExportEntity {
    DONATIONS = 'donations',
    DONORS = 'donors',
    CAMPAIGNS = 'campaigns',
}

export enum ExportFormat {
    CSV = 'csv',
    XLSX = 'xlsx',
    JSON = 'json',
}

export enum SortOrder {
    ASC = 'ASC',
    DESC = 'DESC',
}

export class ExportFiltersDto {
    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    search?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    donorId?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    campaignId?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    causeId?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    constituencyId?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    subConstituencyId?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsNumber()
    @Min(0)
    @Type(() => Number)
    minAmount?: number;

    @ApiPropertyOptional()
    @IsOptional()
    @IsNumber()
    @Min(0)
    @Type(() => Number)
    maxAmount?: number;

    @ApiPropertyOptional()
    @IsOptional()
    @Type(() => Date)
    startDate?: Date;

    @ApiPropertyOptional()
    @IsOptional()
    @Type(() => Date)
    endDate?: Date;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    payment_method?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    sortBy?: string;

    @ApiPropertyOptional({ enum: SortOrder, default: SortOrder.DESC })
    @IsEnum(SortOrder)
    @IsOptional()
    order?: SortOrder = SortOrder.DESC;
}

export class ExportRequestDto {
    @ApiProperty({ enum: ExportEntity })
    @IsEnum(ExportEntity)
    entity: ExportEntity;

    @ApiProperty({ enum: ExportFormat, default: ExportFormat.CSV })
    @IsEnum(ExportFormat)
    @IsOptional()
    format?: ExportFormat = ExportFormat.CSV;

    @ApiPropertyOptional()
    @IsOptional()
    @ValidateNested()
    @Type(() => ExportFiltersDto)
    filters?: ExportFiltersDto;

    @ApiPropertyOptional()
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    columns?: string[];
}
