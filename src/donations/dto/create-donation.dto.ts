import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString, IsUUID } from 'class-validator';

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
}
