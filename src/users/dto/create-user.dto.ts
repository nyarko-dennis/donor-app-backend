import { UserRole } from '../user.entity';

export class CreateUserDto {
    email: string;
    password: string;
    first_name: string;
    last_name: string;
    role?: UserRole;
}
