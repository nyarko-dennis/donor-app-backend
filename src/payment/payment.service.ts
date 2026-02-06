import { Injectable, BadRequestException } from '@nestjs/common';
import { PaymentStrategy, PaymentDto, PaymentResponse } from './payment.interface';
import { PaystackStrategy } from './strategies/paystack.strategy';

@Injectable()
export class PaymentService {
    private strategy: PaymentStrategy;

    constructor(private paystackStrategy: PaystackStrategy) {
        // Default strategy. We can make this dynamic if needed.
        this.strategy = this.paystackStrategy;
    }

    setStrategy(strategy: PaymentStrategy) {
        this.strategy = strategy;
    }

    async initiatePayment(data: PaymentDto): Promise<PaymentResponse> {
        return this.strategy.initiatePayment(data);
    }

    async verifyPayment(reference: string): Promise<PaymentResponse> {
        return this.strategy.verifyPayment(reference);
    }
}
