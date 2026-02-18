import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsOptional, IsString } from 'class-validator';
import { PageOptionsDto } from '../../common/dto/page-options.dto';

export class DonorsPageOptionsDto extends PageOptionsDto {
    @ApiPropertyOptional({ type: String, description: 'Comma-separated constituency IDs' })
    @Transform(({ value }) => (typeof value === 'string' ? value.split(',') : value))
    @IsString({ each: true })
    @IsOptional()
    readonly constituencyId?: string | string[];

    @ApiPropertyOptional({ type: String, description: 'Comma-separated sub-constituency IDs' })
    @Transform(({ value }) => (typeof value === 'string' ? value.split(',') : value))
    @IsString({ each: true })
    @IsOptional()
    readonly subConstituencyId?: string | string[];

    @ApiPropertyOptional({ description: 'Column name to sort by', default: 'date_joined' })
    @IsString()
    @IsOptional()
    readonly sortBy?: string = 'date_joined';
}
