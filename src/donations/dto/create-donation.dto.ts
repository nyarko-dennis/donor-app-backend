import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateDonationDto {
    @ApiProperty({ example: 100.50 })
    @IsNumber()
    amount: number;

    @ApiProperty({ example: 'USD' })
    @IsString()
    currency: string;

    @ApiProperty({ example: 'Credit Card' })
    @IsString()
    payment_method: string;

    @ApiProperty({ example: 'General Support' })
    @IsString()
    donation_cause: string;

    @ApiProperty({ example: 'uuid-of-donor' })
    @IsUUID()
    donorId: string;

    @ApiProperty({ example: 'uuid-of-campaign' })
    @IsUUID()
    campaignId: string;

    @ApiProperty({ example: '2024-01-01T00:00:00Z', required: false })
    @IsString()
    @IsOptional()
    donation_date?: string;

    @ApiProperty({ example: 'uuid-of-constituency', required: false })
    @IsUUID()
    @IsOptional()
    constituency_id?: string;

    @ApiProperty({ example: 'uuid-of-sub-constituency', required: false })
    @IsUUID()
    @IsOptional()
    sub_constituency_id?: string;
}
