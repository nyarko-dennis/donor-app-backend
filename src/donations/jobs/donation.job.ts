import { Injectable, Logger } from '@nestjs/common';
import { Job } from 'pg-boss';
import { MailService } from '../../mail/mail.service';

@Injectable()
export class DonationJob {
  private readonly logger = new Logger(DonationJob.name);

  constructor(private readonly mailService: MailService) {}

  async handle(job: Job) {
    this.logger.log(`Full job object: ${JSON.stringify(job)}`);
    this.logger.log(`Processing donation job: ${job?.id}`);
    this.logger.log(`Data: ${JSON.stringify(job?.data)}`);

    // Handle case where job is an array (if batching is somehow enabled)
    let activeJob = job;
    if (Array.isArray(job)) {
      this.logger.log('Job is an array!');
      activeJob = job[0];
      this.logger.log(`First job ID: ${activeJob?.id}`);
    }

    const data = activeJob.data as {
      email?: string;
      amount?: number;
      donationId?: string;
    };
    const { email, amount, donationId } = data;

    // Send the donation success receipt asynchronously
    if (email && amount && donationId) {
      await this.mailService.sendDonationSuccessEmail(
        email,
        amount,
        donationId.substring(0, 8),
      ); // Mock reference code
    }

    this.logger.log(`Donation job processed successfully.`);
  }
}
