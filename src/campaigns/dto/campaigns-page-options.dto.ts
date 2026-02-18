
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type, Transform } from 'class-transformer';
import { IsNumber, IsOptional, IsString } from 'class-validator';
import { PageOptionsDto } from '../../common/dto/page-options.dto';

export class CampaignsPageOptionsDto extends PageOptionsDto {
    @ApiPropertyOptional({ type: String, description: 'Comma-separated statuses' })
    @Transform(({ value }) => (typeof value === 'string' ? value.split(',') : value))
    @IsString({ each: true })
    @IsOptional()
    readonly status?: string | string[];

    @ApiPropertyOptional()
    @Type(() => Number)
    @IsNumber()
    @IsOptional()
    readonly minGoal?: number;

    @ApiPropertyOptional()
    @Type(() => Number)
    @IsNumber()
    @IsOptional()
    readonly maxGoal?: number;
}
