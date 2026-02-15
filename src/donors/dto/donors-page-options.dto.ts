
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID } from 'class-validator';
import { PageOptionsDto } from '../../common/dto/page-options.dto';

export class DonorsPageOptionsDto extends PageOptionsDto {
    @ApiPropertyOptional()
    @IsUUID()
    @IsOptional()
    readonly constituencyId?: string;

    @ApiPropertyOptional()
    @IsUUID()
    @IsOptional()
    readonly subConstituencyId?: string;

    @ApiPropertyOptional({ description: 'Column name to sort by', default: 'date_joined' })
    @IsString()
    @IsOptional()
    readonly sortBy?: string = 'date_joined';
}
