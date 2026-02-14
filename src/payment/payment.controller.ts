import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { PaymentDto } from './payment.interface';

@Controller('payment')
export class PaymentController {
    constructor(private readonly paymentService: PaymentService) { }

    @Post('initialize')
    async initialize(@Body() paymentDto: PaymentDto) {
        // Defaulting to Paystack for now, or get from DTO if available
        return this.paymentService.initialize('paystack', paymentDto);
    }

    @Get('verify/:reference')
    async verify(@Param('reference') reference: string) {
        return this.paymentService.verify('paystack', reference);
    }
}
