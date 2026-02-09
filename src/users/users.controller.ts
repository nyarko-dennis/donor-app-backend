import { Controller, Post, Body, Get, UseGuards, Query, Param, Patch, Delete, NotFoundException } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { User, UserRole } from './user.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PageOptionsDto } from '../common/dto/page-options.dto';
import { UsersPageOptionsDto } from './dto/users-page-options.dto';
import { PageDto } from '../common/dto/page.dto';

@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

    @Post()
    @Roles(UserRole.SUPER_ADMIN)
    @ApiOperation({ summary: 'Create a new user' })
    @ApiResponse({ status: 201, description: 'The user has been successfully created.', type: UserResponseDto })
    async create(@Body() createUserDto: CreateUserDto): Promise<UserResponseDto> {
        const user = await this.usersService.create(createUserDto);
        return new UserResponseDto(user);
    }

    @Get()
    @Roles(UserRole.SUPER_ADMIN)
    @ApiOperation({ summary: 'Get all users with pagination and search' })
    @ApiResponse({ status: 200, description: 'Return all users.', type: PageDto<UserResponseDto> })
    async findAll(@Query() pageOptionsDto: UsersPageOptionsDto): Promise<PageDto<UserResponseDto>> {
        const page = await this.usersService.findAll(pageOptionsDto);
        return new PageDto(
            page.data.map((user) => new UserResponseDto(user)),
            page.meta,
        );
    }

    @Get(':id')
    @Roles(UserRole.SUPER_ADMIN)
    @ApiOperation({ summary: 'Get user by ID' })
    @ApiResponse({ status: 200, description: 'Return the user.', type: UserResponseDto })
    @ApiResponse({ status: 404, description: 'User not found.' })
    async findOne(@Param('id') id: string): Promise<UserResponseDto> {
        const user = await this.usersService.findById(id);
        if (!user) {
            throw new NotFoundException(`User with ID ${id} not found`);
        }
        return new UserResponseDto(user);
    }

    @Patch(':id')
    @Roles(UserRole.SUPER_ADMIN)
    @ApiOperation({ summary: 'Update user' })
    @ApiResponse({ status: 200, description: 'The user has been successfully updated.', type: UserResponseDto })
    async update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto): Promise<UserResponseDto> {
        const user = await this.usersService.update(id, updateUserDto);
        return new UserResponseDto(user);
    }

    @Delete(':id')
    @Roles(UserRole.SUPER_ADMIN)
    @ApiOperation({ summary: 'Delete user' })
    @ApiResponse({ status: 200, description: 'The user has been successfully deleted.' })
    async remove(@Param('id') id: string): Promise<void> {
        return this.usersService.remove(id);
    }
}
