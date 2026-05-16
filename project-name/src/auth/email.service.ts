import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  async sendOTP(email: string, otp: string): Promise<void> {
    await this.transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Email Verification OTP',
      text: `Your OTP for email verification is ${otp}. It will expire in 10 minutes.`,
    });
  }

  async sendResetOTP(email: string, otp: string): Promise<void> {
    await this.transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Password Reset OTP',
      text: `Your OTP for password reset is ${otp}. It will expire in 10 minutes.`,
    });
  }
}
