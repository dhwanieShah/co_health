import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { logger } from 'src/logger/winston.logger';

@Injectable()
export class MailService {
  private readonly transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  }

  async sendMail(mailOptions: {
    from: string;
    to: string;
    subject: string;
    html: string;
  }) {
    try {
      const info = await this.transporter.sendMail(mailOptions);
      logger.info('Email sent: ' + info.response);
    } catch (error) {
      logger.error('Error sending email: ', error);
    }
  }

  async sendOtp(otp: string, email: string) {
    const htmlContent = `<!DOCTYPE html>
 <html>
        <body style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px;">
          <div style="max-width: 600px; margin: auto; background-color: #ffffff; padding: 20px; border-radius: 10px;">
            <h2 style="text-align: center; color: #333;">Otp Verification</h2>
            <p style="text-align: center; color: #555;">
              Your otp is:
            </p>
            <h3 style="text-align: center; color: #000;">
              ${otp}
            </h3>
            <p style="text-align: center; color: #555;">
              This code will expire in 5 minutes.
            </p>
            <hr>
            <p style="text-align: center; color: #999;">
              If you did not request this code, please ignore this email.
            </p>
          </div>
        </body>
      </html>
</html>`;
    const mailOptions = {
      from: 'smtp.devstree2020@gmail.com',
      to: email,
      subject: 'Your OTP Code',
      html: htmlContent,
    };
    await this.transporter.sendMail(mailOptions);
  }

}
