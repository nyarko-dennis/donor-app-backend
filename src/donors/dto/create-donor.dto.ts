import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString } from 'class-validator';

export class CreateDonorDto {
    @ApiProperty({ example: 'John' })
    @IsString()
    first_name: string;

    @ApiProperty({ example: 'Doe' })
    @IsString()
    last_name: string;

    @ApiProperty({ example: 'john.doe@example.com' })
    @IsEmail()
    email: string;

    @ApiPropertyOptional({ example: '+1234567890' })
    @IsString()
    @IsOptional()
    phone?: string;

    @ApiPropertyOptional({ example: 'Alumni' })
    @IsString()
    @IsOptional()
    constituency?: string;

    @ApiPropertyOptional({ example: 'Engineering' })
    @IsString()
    @IsOptional()
    sub_constituency?: string;
}
