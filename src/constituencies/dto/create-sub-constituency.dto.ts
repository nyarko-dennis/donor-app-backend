import { IsString, IsNotEmpty, MaxLength, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateSubConstituencyDto {
    @ApiProperty({ example: 'Kumasi Metropolitan' })
    @IsString()
    @IsNotEmpty()
    @MaxLength(255)
    name: string;

    @ApiProperty({ example: 'parent-constituency-uuid' })
    @IsUUID()
    @IsNotEmpty()
    constituency_id: string;
}
