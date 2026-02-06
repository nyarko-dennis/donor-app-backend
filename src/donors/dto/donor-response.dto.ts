import { ApiProperty } from '@nestjs/swagger';
import { Donor } from '../donor.entity';

export class DonorResponseDto {
    @ApiProperty()
    id: string;

    @ApiProperty()
    first_name: string;

    @ApiProperty()
    last_name: string;

    @ApiProperty()
    email: string;

    @ApiProperty({ required: false })
    phone: string;

    @ApiProperty({ required: false })
    constituency: string;

    @ApiProperty()
    created_at: Date;

    constructor(donor: Donor) {
        this.id = donor.id;
        this.first_name = donor.first_name;
        this.last_name = donor.last_name;
        this.email = donor.email;
        this.phone = donor.phone;
        this.constituency = donor.constituency;
        this.created_at = donor.date_joined;
    }
}
