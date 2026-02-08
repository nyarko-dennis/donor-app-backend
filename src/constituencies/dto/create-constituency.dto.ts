import { IsString, IsNotEmpty, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateConstituencyDto {
    @ApiProperty({ example: 'Ashanti Region' })
    @IsString()
    @IsNotEmpty()
    @MaxLength(255)
    name: string;
}
