import { Module, forwardRef } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { PaymentController } from './payment.controller';
import { PaystackStrategy } from './strategies/paystack.strategy';
import { PaymentFactory } from './payment.factory';
import { ConfigModule } from '@nestjs/config';
import { WebhookController } from './webhook.controller';
import { QueueModule } from '../queue/queue.module';
import { DonationsModule } from '../donations/donations.module';

@Module({
    imports: [ConfigModule, QueueModule, forwardRef(() => DonationsModule)],
    controllers: [PaymentController, WebhookController],
    providers: [PaymentService, PaystackStrategy, PaymentFactory],
    exports: [PaymentService, PaymentFactory],
})
export class PaymentModule { }
