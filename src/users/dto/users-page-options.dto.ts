
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';
import { PageOptionsDto } from '../../common/dto/page-options.dto';
import { UserRole } from '../user.entity';

export class UsersPageOptionsDto extends PageOptionsDto {
    @ApiPropertyOptional({ enum: UserRole })
    @IsEnum(UserRole)
    @IsOptional()
    readonly role?: UserRole;

    @ApiPropertyOptional()
    @Type(() => Boolean)
    @IsBoolean()
    @IsOptional()
    readonly isActive?: boolean;
}
