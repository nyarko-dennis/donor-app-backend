
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsOptional } from 'class-validator';
import { PageOptionsDto } from '../../common/dto/page-options.dto';

export class DonationCausesPageOptionsDto extends PageOptionsDto {
    @ApiPropertyOptional()
    @Type(() => Boolean)
    @IsBoolean()
    @IsOptional()
    readonly isActive?: boolean;
}
