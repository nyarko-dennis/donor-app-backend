import { ApiProperty } from '@nestjs/swagger';
import { SubConstituencyResponseDto } from './sub-constituency-response.dto';

export class ConstituencyResponseDto {
    @ApiProperty({ example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11' })
    id: string;

    @ApiProperty({ example: 'Ashanti Region' })
    name: string;

    @ApiProperty({ type: () => [SubConstituencyResponseDto], required: false })
    sub_constituencies?: SubConstituencyResponseDto[];

    @ApiProperty()
    created_at: Date;
}
