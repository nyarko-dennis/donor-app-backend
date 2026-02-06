import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateCampaignDto {
    @ApiProperty({ example: 'Annual Gala' })
    @IsString()
    name: string;

    @ApiPropertyOptional({ example: 'Fundraising for new library' })
    @IsString()
    @IsOptional()
    description?: string;

    @ApiPropertyOptional({ example: 'Alumni' })
    @IsString()
    @IsOptional()
    target_audience?: string;

    @ApiPropertyOptional({ example: 50000 })
    @IsNumber()
    @IsOptional()
    goal_amount?: number;

    @ApiPropertyOptional({ example: '2024-01-01' })
    @IsDateString()
    @IsOptional()
    start_date?: string;

    @ApiPropertyOptional({ example: '2024-12-31' })
    @IsDateString()
    @IsOptional()
    end_date?: string;

    @ApiPropertyOptional({ example: 'Active' })
    @IsString()
    @IsOptional()
    status?: string;
}
