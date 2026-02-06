import { Module } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { PaymentController } from './payment.controller';
import { PaystackStrategy } from './strategies/paystack.strategy';
import { ConfigModule } from '@nestjs/config';

@Module({
    imports: [ConfigModule],
    controllers: [PaymentController],
    providers: [PaymentService, PaystackStrategy],
    exports: [PaymentService],
})
export class PaymentModule { }
