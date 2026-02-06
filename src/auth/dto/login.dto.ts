import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, IsOptional } from 'class-validator';

export class LoginDto {
    @ApiProperty({ example: 'admin@gis.edu.gh' })
    @IsEmail()
    email: string;

    @ApiProperty({ example: 'admin123' })
    @IsString()
    password: string;

    @ApiProperty({ example: '123456', required: false })
    @IsString()
    @IsOptional()
    code?: string;
}
