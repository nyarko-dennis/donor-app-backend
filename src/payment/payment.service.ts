import { Injectable } from '@nestjs/common';
import { PaymentDto, InitializationResult, VerificationResult } from './payment.interface';
import { PaymentFactory } from './payment.factory';

@Injectable()
export class PaymentService {
    constructor(private paymentFactory: PaymentFactory) { }

    async initialize(provider: string, data: PaymentDto): Promise<InitializationResult> {
        const strategy = this.paymentFactory.getProvider(provider);
        return strategy.initialize(data);
    }

    async verify(provider: string, reference: string): Promise<VerificationResult> {
        const strategy = this.paymentFactory.getProvider(provider);
        return strategy.verify(reference);
    }
}
