import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { getForgotPasswordEmail } from './templates/forgot-password';
import { getDonationSuccessEmail } from './templates/donation-success';
import * as path from 'path';

@Injectable()
export class MailService {
  private transporter;
  private readonly logger = new Logger(MailService.name);

  constructor() {
    // For development, we log to console (or use Ethereal if configured)
    // If SMTP credentials are provided in env, use them
    if (process.env.SMTP_HOST) {
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT) || 587,
        secure: false, // true for 465, false for other ports
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
    }
  }

  // Shared generic attachment array referencing our core asset setup
  private get defaultAttachments() {
    return [
      {
        filename: 'gis_logo.png',
        // In production / dist, this resolved relative to __dirname (which is dist/mail)
        path: path.join(__dirname, 'resources', 'gis_logo.png'),
        cid: 'gis_logo',
      },
    ];
  }

  async sendPasswordResetEmail(to: string, token: string) {
    const resetLink = `http://localhost:3000/auth/reset-password?token=${token}`;
    const htmlMessage = getForgotPasswordEmail(resetLink);

    if (this.transporter) {
      await this.transporter.sendMail({
        from: '"GIS" <hello@gis.edu.gh>',
        to,
        subject: 'Reset Your Password',
        html: htmlMessage,
        attachments: this.defaultAttachments,
      });
      this.logger.log(`[MailService] Email sent to ${to}`);
    } else {
      this.logger.log(`[MailService] Mock Sending Email to ${to}`);
      this.logger.log(`[MailService] Subject: Reset Your Password`);
    }
  }

  async sendDonationSuccessEmail(
    to: string,
    amount: number,
    reference: string,
  ) {
    const htmlMessage = getDonationSuccessEmail(amount, reference);

    if (this.transporter) {
      await this.transporter.sendMail({
        from: '"GIS" <hello@gis.edu.gh>',
        to,
        subject: 'Donation Receipt',
        html: htmlMessage,
        attachments: this.defaultAttachments,
      });
      this.logger.log(`[MailService] Donation Receipt sent to ${to}`);
    } else {
      this.logger.log(`[MailService] Mock Sending Donation Receipt to ${to}`);
      this.logger.log(`[MailService] Subject: Donation Receipt`);
    }
  }
}
