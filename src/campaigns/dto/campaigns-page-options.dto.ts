
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber, IsOptional, IsString } from 'class-validator';
import { PageOptionsDto } from '../../common/dto/page-options.dto';

export class CampaignsPageOptionsDto extends PageOptionsDto {
    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    readonly status?: string;

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
