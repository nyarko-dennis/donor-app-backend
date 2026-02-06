import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { PaymentDto } from './payment.interface';

@Controller('payment')
export class PaymentController {
    constructor(private readonly paymentService: PaymentService) { }

    @Post('initiate')
    async initiatePayment(@Body() paymentDto: PaymentDto) {
        return this.paymentService.initiatePayment(paymentDto);
    }

    @Get('verify/:reference')
    async verifyPayment(@Param('reference') reference: string) {
        return this.paymentService.verifyPayment(reference);
    }
}
