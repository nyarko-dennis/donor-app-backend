import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { PaymentStrategy, PaymentDto, PaymentResponse } from '../payment.interface';
import axios from 'axios';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class PaystackStrategy implements PaymentStrategy {
    private readonly secretKey: string;
    private readonly baseUrl = 'https://api.paystack.co';

    constructor(private configService: ConfigService) {
        this.secretKey = this.configService.get<string>('PAYSTACK_SECRET_KEY') || '';
        if (!this.secretKey) {
            console.warn('PAYSTACK_SECRET_KEY is not set in environment variables');
        }
    }

    async initiatePayment(data: PaymentDto): Promise<PaymentResponse> {
        try {
            const response = await axios.post(
                `${this.baseUrl}/transaction/initialize`,
                {
                    amount: data.amount * 100, // Paystack expects amount in kobo/cents
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
            console.error('Paystack initialization error:', error.response?.data || error.message);
            throw new InternalServerErrorException('Failed to initiate payment with Paystack');
        }
    }

    async verifyPayment(reference: string): Promise<PaymentResponse> {
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
            console.error('Paystack verification error:', error.response?.data || error.message);
            throw new InternalServerErrorException('Failed to verify payment with Paystack');
        }
    }
}
