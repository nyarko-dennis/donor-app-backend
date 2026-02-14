import { Injectable, Logger } from '@nestjs/common';
import { Job } from 'pg-boss';

@Injectable()
export class DonationJob {
    private readonly logger = new Logger(DonationJob.name);

    constructor() { }

    async handle(job: Job) {
        this.logger.log(`Full job object: ${JSON.stringify(job)}`);
        this.logger.log(`Processing donation job: ${job?.id}`);
        this.logger.log(`Data: ${JSON.stringify(job?.data)}`);

        // Handle case where job is an array (if batching is somehow enabled)
        if (Array.isArray(job)) {
            this.logger.log('Job is an array!');
            job = job[0];
            this.logger.log(`First job ID: ${job?.id}`);
        }

        // Here we would send emails, update dashboard stats, etc.
        // For now just log success.
    }
}
