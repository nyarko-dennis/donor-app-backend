
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';
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
}
