
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsNumber, IsOptional, IsString } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { PageOptionsDto } from '../../common/dto/page-options.dto';

export class DonationsPageOptionsDto extends PageOptionsDto {
    @ApiPropertyOptional({ type: String, description: 'Comma-separated donor IDs' })
    @Transform(({ value }) => (typeof value === 'string' ? value.split(',') : value))
    @IsString({ each: true })
    @IsOptional()
    readonly donorId?: string | string[];

    @ApiPropertyOptional({ type: String, description: 'Comma-separated campaign IDs' })
    @Transform(({ value }) => (typeof value === 'string' ? value.split(',') : value))
    @IsString({ each: true })
    @IsOptional()
    readonly campaignId?: string | string[];

    @ApiPropertyOptional({ type: String, description: 'Comma-separated cause IDs' })
    @Transform(({ value }) => (typeof value === 'string' ? value.split(',') : value))
    @IsString({ each: true })
    @IsOptional()
    readonly causeId?: string | string[];

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
