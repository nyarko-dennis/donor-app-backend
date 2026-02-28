import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateClassDto {
  @ApiProperty({ example: 'Infants C1 Violet' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @ApiPropertyOptional({ example: 'Infants C1 Violet' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ example: 4 })
  @IsNumber()
  @IsOptional()
  order?: number;

  @ApiProperty({
    example: 'uuid',
    description: 'ID of the parent SubConstituency',
  })
  @IsUUID()
  @IsNotEmpty()
  sub_constituency_id: string;
}
