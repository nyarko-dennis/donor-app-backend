import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { UserRole } from '../user.entity';

export class CreateUserDto {
    @ApiProperty({ example: 'user@example.com' })
    @IsEmail()
    email: string;

    @ApiProperty({ example: 'password123' })
    @IsString()
    @MinLength(6)
    password: string;

    @ApiProperty({ example: 'John' })
    @IsString()
    first_name: string;

    @ApiProperty({ example: 'Doe' })
    @IsString()
    last_name: string;

    @ApiPropertyOptional({ enum: UserRole, default: UserRole.STAKEHOLDER })
    @IsEnum(UserRole)
    @IsOptional()
    role?: UserRole;
}
