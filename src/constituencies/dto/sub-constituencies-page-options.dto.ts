
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsOptional, IsString } from 'class-validator';
import { PageOptionsDto } from '../../common/dto/page-options.dto';

export class SubConstituenciesPageOptionsDto extends PageOptionsDto {
    @ApiPropertyOptional({ type: String, description: 'Comma-separated constituency IDs' })
    @Transform(({ value }) => (typeof value === 'string' ? value.split(',') : value))
    @IsString({ each: true })
    @IsOptional()
    readonly constituencyId?: string | string[];
}
