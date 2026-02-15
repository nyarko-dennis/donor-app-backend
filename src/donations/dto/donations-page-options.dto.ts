
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDateString, IsNumber, IsOptional, IsString, IsUUID } from 'class-validator';
import { PageOptionsDto } from '../../common/dto/page-options.dto';

export class DonationsPageOptionsDto extends PageOptionsDto {
    @ApiPropertyOptional()
    @IsUUID()
    @IsOptional()
    readonly donorId?: string;

    @ApiPropertyOptional()
    @IsUUID()
    @IsOptional()
    readonly campaignId?: string;

    @ApiPropertyOptional()
    @IsUUID()
    @IsOptional()
    readonly causeId?: string;

    @ApiPropertyOptional()
    @Type(() => Number)
    @IsNumber()
    @IsOptional()
    readonly minAmount?: number;

    @ApiPropertyOptional()
    @Type(() => Number)
    @IsNumber()
    @IsOptional()
    readonly maxAmount?: number;

    @ApiPropertyOptional()
    @IsDateString()
    @IsOptional()
    readonly startDate?: string;

    @ApiPropertyOptional()
    @IsDateString()
    @IsOptional()
    readonly endDate?: string;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    readonly payment_method?: string;
}
