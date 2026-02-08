import { ApiProperty } from '@nestjs/swagger';

export class DonationCauseResponseDto {
    @ApiProperty({ example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11' })
    id: string;

    @ApiProperty({ example: 'Education' })
    name: string;

    @ApiProperty({ example: 'Supporting schools and students', required: false })
    description?: string;

    @ApiProperty({ example: true })
    is_active: boolean;

    @ApiProperty({ example: '2024-02-08T12:00:00Z' })
    created_at: Date;
}
