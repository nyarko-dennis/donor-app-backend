import { ApiProperty } from '@nestjs/swagger';
import { User, UserRole } from '../user.entity';

export class UserResponseDto {
    @ApiProperty()
    id: string;

    @ApiProperty()
    email: string;

    @ApiProperty()
    first_name: string;

    @ApiProperty()
    last_name: string;

    @ApiProperty({ enum: UserRole })
    role: UserRole;

    @ApiProperty()
    is_active: boolean;

    @ApiProperty()
    created_at: Date;

    constructor(user: User) {
        this.id = user.id;
        this.email = user.email;
        this.first_name = user.first_name;
        this.last_name = user.last_name;
        this.role = user.role;
        this.is_active = user.is_active;
        this.created_at = user.created_at;
    }
}
