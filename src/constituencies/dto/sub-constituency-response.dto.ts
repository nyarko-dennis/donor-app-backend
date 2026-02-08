import { ApiProperty } from '@nestjs/swagger';

export class SubConstituencyResponseDto {
    @ApiProperty({ example: 'b1ffcd88-0d1c-5fg9-cc7e-7cc0ce491b22' })
    id: string;

    @ApiProperty({ example: 'Kumasi Metropolitan' })
    name: string;

    @ApiProperty({ example: 'Description', required: false })
    description?: string;

    @ApiProperty({ example: 1, required: false })
    order?: number;

    @ApiProperty({ example: 'parent-constituency-uuid' })
    constituency_id: string;

    @ApiProperty()
    created_at: Date;
}
