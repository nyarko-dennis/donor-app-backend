import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from './user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(User)
        private usersRepository: Repository<User>,
    ) { }

    async create(createUserDto: CreateUserDto): Promise<User> {
        const salt = await bcrypt.genSalt();
        const hashedPassword = await bcrypt.hash(createUserDto.password, salt);

        const user = this.usersRepository.create({
            ...createUserDto,
            password: hashedPassword,
        });
        return this.usersRepository.save(user);
    }

    async findOne(email: string): Promise<User | null> {
        return this.usersRepository.findOneBy({ email });
    }

    async findAll(): Promise<User[]> {
        return this.usersRepository.find();
    }

    async onModuleInit() {
        const adminEmail = process.env.ADMIN_EMAIL || 'admin@gis.edu.gh';
        const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

        const existingAdmin = await this.usersRepository.findOneBy({ email: adminEmail });
        if (!existingAdmin) {
            const salt = await bcrypt.genSalt();
            const hashedPassword = await bcrypt.hash(adminPassword, salt);

            const admin = this.usersRepository.create({
                email: adminEmail,
                password: hashedPassword,
                first_name: 'Super',
                last_name: 'Admin',
                role: UserRole.SUPER_ADMIN,
            });
            await this.usersRepository.save(admin);
            console.log('Default Super Admin created');
        }
    }

    getRoles(): UserRole[] {
        return Object.values(UserRole);
    }
}
