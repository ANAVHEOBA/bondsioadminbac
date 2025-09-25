import { Injectable, Logger } from '@nestjs/common';
import { SendMailClient } from 'zeptomail';

@Injectable()
export class ZeptomailApiService {
  private readonly logger = new Logger(ZeptomailApiService.name);
  private readonly client: SendMailClient;

  constructor() {
    const url = process.env.ZEPTOMAIL_URL || 'api.zeptomail.com/';
    const token = process.env.ZEPTOMAIL_TOKEN;

    if (!token) {
      this.logger.error('❌ ZEPTOMAIL_TOKEN environment variable is not set');
      throw new Error('ZeptoMail API token is required');
    }

    this.client = new SendMailClient({ url, token });
    this.logger.log('✅ ZeptoMail API client initialized');
  }

  /**
   * Generic method to send emails via ZeptoMail API
   */
  async sendMail(mailOptions: any): Promise<any> {
    try {
      const response = await this.client.sendMail(mailOptions);
      this.logger.log(`✅ Email sent successfully via ZeptoMail API`);
      return response;
    } catch (error) {
      this.logger.error(`❌ Failed to send email via ZeptoMail API:`, error);
      throw error;
    }
  }

  /**
   * Send OTP email using ZeptoMail API
   */
  async sendOtpEmail(
    to: string,
    otp: string,
    subject: string = 'Your OTP Code'
  ): Promise<void> {
    try {
      this.logger.log(`📧 Sending OTP email to: ${to}`);

      await this.client.sendMail({
        from: {
          address: process.env.MAIL_FROM_ADDRESS || 'noreply@bondsio.com',
          name: process.env.MAIL_FROM_NAME || 'Bondsio'
        },
        to: [
          {
            email_address: {
              address: to,
              name: to.split('@')[0]
            }
          }
        ],
        subject: subject,
        htmlbody: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8">
            <title>Your OTP Code</title>
          </head>
          <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; padding: 40px; background: linear-gradient(135deg, #6366f1, #8b5cf6); border-radius: 12px; margin-bottom: 30px;">
              <h1 style="color: white; margin: 0; font-size: 28px;">Your OTP Code</h1>
            </div>
            
            <div style="padding: 30px; background: #f8fafc; border-radius: 12px; text-align: center;">
              <p style="font-size: 18px; color: #374151; margin-bottom: 20px;">Use this code to verify your account:</p>
              <div style="font-size: 32px; font-weight: bold; color: #1e293b; background: white; padding: 20px; border-radius: 8px; border: 2px solid #e2e8f0; letter-spacing: 4px; margin: 20px 0;">
                ${otp}
              </div>
              <p style="color: #6b7280; font-size: 14px; margin-top: 20px;">This code will expire in 10 minutes.</p>
            </div>
          </body>
          </html>
        `,
        textbody: `Your OTP Code: ${otp}\n\nUse this code to verify your account.\nThis code will expire in 10 minutes.`
      });

      this.logger.log(`✅ OTP email sent successfully to: ${to}`);
    } catch (error) {
      this.logger.error(`❌ Failed to send OTP email to ${to}:`, error);
      throw error;
    }
  }
}