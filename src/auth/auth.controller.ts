import { Controller, Post, UseGuards, Request, Body, Get } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { ChangePasswordDto } from './dto/change-password.dto';
import { TwoFactorAuthenticationCodeDto } from './dto/two-factor-authentication-code.dto';
import { UsersService } from '../users/users.service';
import { UserResponseDto } from '../users/dto/user-response.dto';
import { UnauthorizedException, NotFoundException } from '@nestjs/common';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
    constructor(
        private authService: AuthService,
        private usersService: UsersService
    ) { }

    @Post('login')
    @ApiOperation({ summary: 'User login' })
    @ApiResponse({ status: 200, description: 'Return JWT access token.' })
    @ApiBody({ type: LoginDto })
    async login(@Body() loginDto: LoginDto) {
        const user = await this.authService.validateUser(loginDto.email, loginDto.password);
        if (!user) {
            return { message: 'Invalid credentials' };
        }

        if (user.is_two_factor_enabled) {
            if (!loginDto.code) {
                return { message: '2FA code required', isTwoFactorAuthenticationRequired: true };
            }

            const isCodeValid = await this.authService.isTwoFactorAuthenticationCodeValid(
                loginDto.code,
                user,
            );
            if (!isCodeValid) {
                return { message: 'Wrong 2FA code' }; // Or throw Unauthorized
            }
            return this.authService.loginWith2fa(user);
        }

        return this.authService.login(user); // Fixed: ensure calling correct service method
    }

    @UseGuards(JwtAuthGuard)
    @Get('profile')
    @ApiOperation({ summary: 'Get current user profile' })
    @ApiResponse({ status: 200, description: 'Return current user profile.', type: UserResponseDto })
    async getProfile(@Request() req) {
        const user = await this.usersService.findById(req.user.userId);
        if (!user) {
            throw new NotFoundException('User not found');
        }
        return new UserResponseDto(user);
    }

    @Post('forgot-password')
    @ApiOperation({ summary: 'Request password reset' })
    @ApiResponse({ status: 200, description: 'Password reset email sent if account exists.' })
    @ApiBody({ type: ForgotPasswordDto })
    async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
        return this.authService.forgotPassword(forgotPasswordDto.email);
    }

    @Post('reset-password')
    @ApiOperation({ summary: 'Reset password with token' })
    @ApiResponse({ status: 200, description: 'Password successfully reset.' })
    @ApiBody({ type: ResetPasswordDto })
    async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
        return this.authService.resetPassword(resetPasswordDto.token, resetPasswordDto.newPassword);
    }

    @UseGuards(JwtAuthGuard)
    @Post('change-password')
    @ApiOperation({ summary: 'Change password (logged in)' })
    @ApiResponse({ status: 200, description: 'Password changed successfully.' })
    @ApiBody({ type: ChangePasswordDto })
    async changePassword(@Request() req, @Body() changePasswordDto: ChangePasswordDto) {
        return this.authService.changePassword(req.user.userId, changePasswordDto.oldPassword, changePasswordDto.newPassword);
    }

    @UseGuards(JwtAuthGuard)
    @Get('2fa/generate')
    @ApiOperation({ summary: 'Generate 2FA QR Code' })
    @ApiResponse({ status: 200, description: 'QR Code Data URL' })
    async generateTwoFactorAuthentication(@Request() req) {
        const { otpauthUrl } = await this.authService.generateTwoFactorAuthenticationSecret(req.user);
        return this.authService.generateQrCodeDataURL(otpauthUrl);
    }

    @UseGuards(JwtAuthGuard)
    @Post('2fa/turn-on')
    @ApiOperation({ summary: 'Turn on 2FA' })
    @ApiResponse({ status: 200, description: '2FA enabled' })
    @ApiBody({ type: TwoFactorAuthenticationCodeDto }) // We need to import this
    async turnOnTwoFactorAuthentication(@Request() req, @Body() body: TwoFactorAuthenticationCodeDto) {
        const isCodeValid = await this.authService.isTwoFactorAuthenticationCodeValid(
            body.code,
            req.user,
        );
        if (!isCodeValid) {
            throw new UnauthorizedException('Wrong authentication code');
        }
        await this.usersService.turnOnTwoFactorAuthentication(req.user.id);
        return { message: '2FA has been turned on' };
    }
}
