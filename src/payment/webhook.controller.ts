import { Controller, Post, Body, Headers, UseGuards, Res, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { PaystackWebhookGuard } from './guards/paystack-webhook.guard';
import { QueueService } from '../queue/queue.service';
import { DonationsService } from '../donations/donations.service';

@Controller('payment/webhook')
export class WebhookController {
    constructor(
        private readonly queueService: QueueService,
        private readonly donationsService: DonationsService,
    ) { }

    @Post('paystack')
    @UseGuards(PaystackWebhookGuard)
    async handlePaystackWebhook(@Body() payload: any, @Res() res: Response) {
        // Idempotency and basic processing is done in DonationsService
        // but for webhook specific logic we can delegate or handle here.
        // The guard ensures it's legit.

        const event = payload.event;
        const data = payload.data;

        if (event === 'charge.success') {
            const reference = data.reference;
            await this.donationsService.handleSuccessWebhook(reference, 'paystack');
        }

        return res.status(HttpStatus.OK).send();
    }
}
