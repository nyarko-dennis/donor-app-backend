import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { PaymentProvider, PaymentDto, InitializationResult, VerificationResult } from '../payment.interface';
import axios from 'axios';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

@Injectable()
export class PaystackStrategy implements PaymentProvider {
    private readonly logger = new Logger(PaystackStrategy.name);
    private readonly secretKey: string;
    private readonly baseUrl = 'https://api.paystack.co';

    constructor(private configService: ConfigService) {
        this.secretKey = this.configService.get<string>('PAYSTACK_SECRET_KEY') || '';
        if (!this.secretKey) {
            this.logger.warn('PAYSTACK_SECRET_KEY is not set in environment variables');
        }
    }

    async initialize(data: PaymentDto): Promise<InitializationResult> {
        try {
            const response = await axios.post(
                `${this.baseUrl}/transaction/initialize`,
                {
                    amount: Math.round(data.amount * 100), // Paystack expects amount in kobo/cents
                    email: data.email,
                    currency: data.currency || 'GHS',
                    metadata: data.metadata,
                },
                {
                    headers: {
                        Authorization: `Bearer ${this.secretKey}`,
                        'Content-Type': 'application/json',
                    },
                }
            );

            return {
                status: true,
                message: 'Payment initialized successfully',
                data: response.data.data,
            };
        } catch (error) {
            this.logger.error('Paystack initialization error:', error.response?.data || error.message);
            throw new InternalServerErrorException('Failed to initiate payment with Paystack');
        }
    }

    async verify(reference: string): Promise<VerificationResult> {
        try {
            const response = await axios.get(
                `${this.baseUrl}/transaction/verify/${reference}`,
                {
                    headers: {
                        Authorization: `Bearer ${this.secretKey}`,
                    },
                }
            );

            if (response.data.data.status === 'success') {
                return {
                    status: true,
                    message: 'Payment verified successfully',
                    data: response.data.data,
                };
            }

            return {
                status: false,
                message: 'Payment verification failed',
                data: response.data.data,
            };
        } catch (error) {
            this.logger.error('Paystack verification error:', error.response?.data || error.message);
            throw new InternalServerErrorException('Failed to verify payment with Paystack');
        }
    }

    async handleWebhook(payload: any, signature: string): Promise<boolean> {
        const hash = crypto.createHmac('sha512', this.secretKey)
            .update(JSON.stringify(payload))
            .digest('hex');

        if (hash === signature) {
            return true;
        }
        return false;
    }
}

