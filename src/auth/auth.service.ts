import { Injectable, UnauthorizedException, BadRequestException, NotFoundException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User } from '../users/user.entity';
import { MailService } from '../mail/mail.service';
import { generateSecret, verify, generateURI } from 'otplib';
import { toDataURL } from 'qrcode';

@Injectable()
export class AuthService {
    constructor(
        private usersService: UsersService,
        private jwtService: JwtService,
        private mailService: MailService,
    ) { }

    async validateUser(email: string, pass: string): Promise<any> {
        const user = await this.usersService.findOne(email);
        if (user && (await bcrypt.compare(pass, user.password))) {
            const { password, ...result } = user;
            return result;
        }
        return null;
    }

    async login(user: any) {
        const payload = { username: user.email, sub: user.id, role: user.role };
        return {
            access_token: this.jwtService.sign(payload),
        };
    }

    async forgotPassword(email: string) {
        const user = await this.usersService.findOne(email);
        if (!user) {
            return { message: 'If this email exists, a password reset link has been sent.' };
        }

        const payload = { sub: user.id, purpose: 'reset-password' };
        const token = this.jwtService.sign(payload, { expiresIn: '15m' });

        await this.mailService.sendPasswordResetEmail(user.email, token);

        return { message: 'If this email exists, a password reset link has been sent.' };
    }

    async resetPassword(token: string, newPassword: string) {
        try {
            const payload = this.jwtService.verify(token);
            if (payload.purpose !== 'reset-password') {
                throw new BadRequestException('Invalid token purpose');
            }

            const user = await this.usersService.findById(payload.sub);
            if (!user) {
                throw new NotFoundException('User not found');
            }

            const salt = await bcrypt.genSalt();
            const hashedPassword = await bcrypt.hash(newPassword, salt);

            await this.usersService.updatePassword(user.id, hashedPassword);

            return { message: 'Password has been successfully reset.' };
        } catch (error) {
            throw new BadRequestException('Invalid or expired token.');
        }
    }

    async changePassword(userId: string, oldPassword: string, newPassword: string) {
        const user = await this.usersService.findById(userId);
        if (!user) {
            throw new NotFoundException('User not found');
        }

        const isMatch = await bcrypt.compare(oldPassword, user.password);
        if (!isMatch) {
            throw new BadRequestException('Invalid old password');
        }

        const salt = await bcrypt.genSalt();
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        await this.usersService.updatePassword(userId, hashedPassword);

        return { message: 'Password has been successfully changed.' };
    }

    async generateTwoFactorAuthenticationSecret(user: User) {
        const secret = generateSecret();
        const otpauthUrl = generateURI({
            secret,
            issuer: 'DonorApp',
            label: user.email,
        });
        await this.usersService.setTwoFactorSecret(secret, user.id);
        return {
            secret,
            otpauthUrl,
        };
    }

    async generateQrCodeDataURL(otpAuthUrl: string) {
        return toDataURL(otpAuthUrl);
    }

    async isTwoFactorAuthenticationCodeValid(twoFactorAuthenticationCode: string, user: User) {
        return verify({
            token: twoFactorAuthenticationCode,
            secret: user.two_factor_secret,
        });
    }

    async loginWith2fa(user: any) {
        const payload = { username: user.email, sub: user.id, role: user.role, isTwoFactorAuthenticated: true };
        return {
            access_token: this.jwtService.sign(payload),
        };
    }
}
