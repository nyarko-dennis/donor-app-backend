import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString, IsUUID, IsOptional, IsEmail, ValidateNested, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class DonorInfoDto {
    @ApiProperty({ example: 'Dennis' })
    @IsString()
    first_name: string;

    @ApiProperty({ example: 'Nyarko-Antwi' })
    @IsString()
    last_name: string;

    @ApiProperty({ example: 'dennis@yazi-tech.com' })
    @IsEmail()
    email: string;

    @ApiProperty({ example: '024 994 3559', required: false })
    @IsString()
    @IsOptional()
    phone?: string;

    @ApiProperty({ example: 'uuid-of-constituency', required: false })
    @IsUUID()
    @IsOptional()
    constituency_id?: string;

    @ApiProperty({ example: 'uuid-of-sub-constituency', required: false })
    @IsUUID()
    @IsOptional()
    sub_constituency_id?: string;
}

export class InitiateDonationDto {
    @ApiProperty({ example: 20 })
    @IsNumber()
    @Min(1)
    amount: number;

    @ApiProperty({ example: 'dennis@yazi-tech.com' })
    @IsEmail()
    email: string;

    @ApiProperty({ example: 'Mobile Money' })
    @IsString()
    payment_method: string;

    @ApiProperty({ example: 'uuid-of-campaign' })
    @IsUUID()
    campaignId: string;

    @ApiProperty({ example: 'uuid-of-cause', required: false })
    @IsUUID()
    @IsOptional()
    donation_cause?: string;

    @ApiProperty({ type: DonorInfoDto })
    @ValidateNested()
    @Type(() => DonorInfoDto)
    donor: DonorInfoDto;
}
