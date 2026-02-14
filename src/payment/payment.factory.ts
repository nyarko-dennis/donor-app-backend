import { Injectable, BadRequestException } from '@nestjs/common';
import { PaymentProvider } from './payment.interface';
import { PaystackStrategy } from './strategies/paystack.strategy';

@Injectable()
export class PaymentFactory {
    constructor(
        private paystack: PaystackStrategy,
    ) { }

    getProvider(providerName: string): PaymentProvider {
        switch (providerName.toLowerCase()) {
            case 'paystack':
                return this.paystack;
            default:
                throw new BadRequestException(`Payment provider '${providerName}' is not supported`);
        }
    }
}
