import { IsString, IsNotEmpty, MaxLength, IsUUID, IsOptional, IsInt } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateSubConstituencyDto {
    @ApiProperty({ example: 'Kumasi Metropolitan' })
    @IsString()
    @IsNotEmpty()
    @MaxLength(255)
    name: string;

    @ApiProperty({ example: 'Description of the sub-constituency', required: false })
    @IsOptional()
    @IsString()
    description?: string;

    @ApiProperty({ example: 1, required: false })
    @IsOptional()
    @IsInt()
    order?: number;

    @ApiProperty({ example: 'parent-constituency-uuid' })
    @IsUUID()
    @IsNotEmpty()
    constituency_id: string;
}
