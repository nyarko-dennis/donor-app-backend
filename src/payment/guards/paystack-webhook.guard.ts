import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { Request } from 'express';

@Injectable()
export class PaystackWebhookGuard implements CanActivate {
    constructor(private readonly configService: ConfigService) { }

    canActivate(context: ExecutionContext): boolean {
        const request = context.switchToHttp().getRequest<Request>();
        const signature = request.headers['x-paystack-signature'] as string;

        if (!signature) {
            throw new UnauthorizedException('No signature provided');
        }

        const secret = this.configService.get<string>('PAYSTACK_SECRET_KEY');
        if (!secret) {
            throw new UnauthorizedException('Secret key not configured');
        }

        // NestJS rawBody must be enabled in main.ts
        const rawBody = (request as any).rawBody;

        if (!rawBody) {
            console.error('Raw body not found on request. Ensure rawBody: true is set in NestFactory options.');
            throw new UnauthorizedException('Could not verify signature (missing raw body)');
        }

        const hash = crypto.createHmac('sha512', secret)
            .update(rawBody)
            .digest('hex');

        if (hash !== signature) {
            throw new UnauthorizedException('Invalid signature');
        }

        return true;
    }
}
