import { Injectable, InternalServerErrorException } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private transporter;

  constructor() {
    const host = process.env.SMTP_HOST;
    const port = Number(process.env.SMTP_PORT || 587);
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASSWORD;

    if (!host || !user || !pass) {
      throw new Error('SMTP configuration is missing.');
    }

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: {
        user,
        pass,
      },
    });
  }

  async sendPasswordResetEmail(
    email: string,
    firstName: string,
    resetUrl: string,
  ) {
    try {
      await this.transporter.sendMail({
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to: email,
        subject: 'Reset Your Erevna LMS Password',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
            <h2>Erevna LMS</h2>

            <p>Hello ${firstName},</p>

            <p>
              We received a request to reset your Erevna LMS password.
            </p>

            <p>
              Click the button below to create a new password:
            </p>

            <p>
              <a
                href="${resetUrl}"
                style="
                  display:inline-block;
                  padding:12px 20px;
                  background:#2563eb;
                  color:white;
                  text-decoration:none;
                  border-radius:8px;
                "
              >
                Reset Password
              </a>
            </p>

            <p>
              This link will expire in 30 minutes.
            </p>

            <p>
              If you did not request this password reset, you can safely
              ignore this email.
            </p>

            <p>
              Erevna LMS
            </p>
          </div>
        `,
      });
    } catch (error) {
      console.error('Password reset email failed:', error);

      throw new InternalServerErrorException(
        'Unable to send password reset email.',
      );
    }
  }
}
