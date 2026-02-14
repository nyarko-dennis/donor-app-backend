import { Injectable, Logger } from '@nestjs/common';
import { Job } from 'pg-boss';

@Injectable()
export class DonationJob {
    private readonly logger = new Logger(DonationJob.name);

    constructor() { }

    async handle(job: Job) {
        this.logger.log(`Processing donation job: ${job.id}`);
        this.logger.log(`Data: ${JSON.stringify(job.data)}`);

        // Here we would send emails, update dashboard stats, etc.
        // For now just log success.
    }
}
