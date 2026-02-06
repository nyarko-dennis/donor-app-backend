import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
    private transporter;

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

    async sendPasswordResetEmail(to: string, token: string) {
        const resetLink = `http://localhost:3000/auth/reset-password?token=${token}`;
        const message = `
      <h1>Password Reset Request</h1>
      <p>Click the link below to reset your password:</p>
      <a href="${resetLink}">${resetLink}</a>
      <p>If you did not request this, please ignore this email.</p>
    `;

        if (this.transporter) {
            await this.transporter.sendMail({
                from: '"Donor App" <noreply@donorapp.com>',
                to,
                subject: 'Password Reset',
                html: message,
            });
            console.log(`[MailService] Email sent to ${to}`);
        } else {
            console.log(`[MailService] Mock Sending Email to ${to}`);
            console.log(`[MailService] Subject: Password Reset`);
            console.log(`[MailService] Body: ${resetLink}`);
        }
    }
}
