
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';
import { PageOptionsDto } from '../../common/dto/page-options.dto';
import { UserRole } from '../user.entity';

export class UsersPageOptionsDto extends PageOptionsDto {
    @ApiPropertyOptional({ enum: UserRole, type: String, description: 'Comma-separated roles' })
    @Transform(({ value }) => (typeof value === 'string' ? value.split(',') : value))
    @IsEnum(UserRole, { each: true })
    @IsOptional()
    readonly role?: UserRole | UserRole[];

    @ApiPropertyOptional()
    @Transform(({ value }) => {
        if (value === 'true') return true;
        if (value === 'false') return false;
        return value;
    })
    @IsBoolean()
    @IsOptional()
    readonly is_active?: boolean;
}
