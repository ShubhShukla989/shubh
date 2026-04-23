import nodemailer from 'nodemailer';
import { htmlEscape } from './utils';

interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text: string;
}

class EmailService {
  private transporter: nodemailer.Transporter | null = null;
  private isConfigured = false;
  private initializationPromise: Promise<void> | null = null;

  constructor() {
    this.initializationPromise = this.initializeTransporter();
  }

  private async initializeTransporter(): Promise<void> {
    try {
      const config: EmailConfig = {
        host: process.env.EMAIL_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.EMAIL_PORT || '587'),
        secure: process.env.EMAIL_SECURE === 'true',
        auth: {
          user: process.env.EMAIL_USER || '',
          pass: process.env.EMAIL_PASS || '',
        },
      };

      if (!config.auth.user || !config.auth.pass) {
        console.warn('Email credentials not configured. Email functionality will be disabled.');
        return;
      }

      this.transporter = nodemailer.createTransport(config);

      // Verify connection asynchronously
      if (this.transporter) {
        await this.transporter.verify();
        this.isConfigured = true;
        console.log('Email service ready');
      }
    } catch (error) {
      console.error('Failed to initialize email service:', error);
      this.isConfigured = false;
      this.transporter = null;
    }
  }

  async waitForInitialization(): Promise<void> {
    if (this.initializationPromise) {
      await this.initializationPromise;
    }
  }

  async sendEmail(options: EmailOptions): Promise<{ success: boolean; error?: string }> {
    await this.waitForInitialization();

    if (!this.isConfigured || !this.transporter) {
      return {
        success: false,
        error: 'Email service not configured'
      };
    }

    try {
      const mailOptions = {
        from: `"ePaper CMS" <${process.env.EMAIL_USER}>`,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      };

      await this.transporter.sendMail(mailOptions);
      return { success: true };
    } catch (error) {
      console.error('Failed to send email:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown email error'
      };
    }
  }

  async sendOTPEmail(email: string, otp: string, expiryMinutes: number = 10): Promise<{ success: boolean; error?: string }> {
    const subject = 'Password Reset OTP - ePaper CMS';
    
    // Escape OTP for HTML safety (though OTP should only contain digits)
    const escapedOTP = htmlEscape(otp);
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Reset OTP</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
          .otp-box { background: white; border: 2px solid #667eea; border-radius: 10px; padding: 20px; text-align: center; margin: 20px 0; }
          .otp-code { font-size: 32px; font-weight: bold; color: #667eea; letter-spacing: 5px; margin: 10px 0; font-family: monospace; }
          .warning { background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 5px; padding: 15px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
          @media only screen and (max-width: 600px) {
            .container { padding: 10px; }
            .header, .content { padding: 20px; }
            .otp-code { font-size: 24px; }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>ePaper CMS</h1>
            <p>Password Reset Request</p>
          </div>
          <div class="content">
            <h2>Your Password Reset OTP</h2>
            <p>You requested to reset your password. Use the OTP below to proceed:</p>
            
            <div class="otp-box">
              <p>Your OTP Code:</p>
              <div class="otp-code">${escapedOTP}</div>
              <p><strong>Expires in ${expiryMinutes} minutes</strong></p>
            </div>
            
            <div class="warning">
              <strong>Security Notice:</strong>
              <ul>
                <li>This OTP is valid for ${expiryMinutes} minutes only</li>
                <li>Do not share this code with anyone</li>
                <li>If you didn't request this, please ignore this email</li>
                <li>For security, this email was sent from an automated system</li>
              </ul>
            </div>
            
            <p>If you're having trouble, contact our support team.</p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} ePaper CMS. All rights reserved.</p>
            <p>This is an automated email. Please do not reply.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
      ePaper CMS - Password Reset OTP
      
      Your OTP Code: ${otp}
      Expires in: ${expiryMinutes} minutes
      
      Security Notice:
      - This OTP is valid for ${expiryMinutes} minutes only
      - Do not share this code with anyone
      - If you didn't request this, please ignore this email
      
      © ${new Date().getFullYear()} ePaper CMS. All rights reserved.
    `;

    return this.sendEmail({ to: email, subject, html, text });
  }

  async isReady(): Promise<boolean> {
    await this.waitForInitialization();
    return this.isConfigured;
  }

  // Synchronous version for backward compatibility
  isReadySync(): boolean {
    return this.isConfigured;
  }
}

// Singleton instance
export const emailService = new EmailService();
export default emailService;