import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from './user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PageOptionsDto } from '../common/dto/page-options.dto';
import { UsersPageOptionsDto } from './dto/users-page-options.dto';
import { PageDto } from '../common/dto/page.dto';
import { PageMetaDto } from '../common/dto/page-meta.dto';
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

    async findById(id: string): Promise<User | null> {
        return this.usersRepository.findOneBy({ id });
    }

    async updatePassword(id: string, hashedPassword: string): Promise<void> {
        await this.usersRepository.update(id, { password: hashedPassword });
    }

    async setTwoFactorSecret(secret: string, userId: string): Promise<void> {
        await this.usersRepository.update(userId, { two_factor_secret: secret });
    }

    async turnOnTwoFactorAuthentication(userId: string): Promise<void> {
        await this.usersRepository.update(userId, { is_two_factor_enabled: true });
    }

    async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
        const user = await this.findById(id);
        if (!user) {
            throw new NotFoundException(`User with ID ${id} not found`);
        }

        if (updateUserDto.password) {
            const salt = await bcrypt.genSalt();
            updateUserDto.password = await bcrypt.hash(updateUserDto.password, salt);
        }

        Object.assign(user, updateUserDto);
        return this.usersRepository.save(user);
    }

    async remove(id: string): Promise<void> {
        const result = await this.usersRepository.delete(id);
        if (result.affected === 0) {
            throw new NotFoundException(`User with ID ${id} not found`);
        }
    }

    async findAll(pageOptionsDto: UsersPageOptionsDto): Promise<PageDto<User>> {
        const queryBuilder = this.usersRepository.createQueryBuilder('user');

        if (pageOptionsDto.search) {
            queryBuilder.where(
                '(user.first_name ILIKE :search OR user.last_name ILIKE :search OR user.email ILIKE :search)',
                { search: `%${pageOptionsDto.search}%` },
            );
        }

        if (pageOptionsDto.role) {
            queryBuilder.andWhere('user.role = :role', { role: pageOptionsDto.role });
        }

        if (pageOptionsDto.isActive !== undefined) {
            queryBuilder.andWhere('user.is_active = :isActive', { isActive: pageOptionsDto.isActive });
        }

        queryBuilder
            .orderBy(`user.${pageOptionsDto.sortBy || 'created_at'}`, pageOptionsDto.order)
            .skip(pageOptionsDto.skip)
            .take(pageOptionsDto.take);

        const itemCount = await queryBuilder.getCount();
        const { entities } = await queryBuilder.getRawAndEntities();

        const pageMetaDto = new PageMetaDto({ itemCount, pageOptionsDto });

        return new PageDto(entities, pageMetaDto);
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
