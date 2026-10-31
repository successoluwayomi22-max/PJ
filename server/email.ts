/**
 * Enterprise Email Delivery Service
 * Implements genuine SMTP transport via Nodemailer with environment configuration.
 * In development sandbox mode, logs delivery metadata securely without exposing secrets.
 * In production mode, rejects dispatches if SMTP transport is not configured.
 */

import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import crypto from 'node:crypto';

export interface EmailOptions {
  to: string;
  subject: string;
  text: string;
  html: string;
}

export interface EmailDeliveryResult {
  success: boolean;
  messageId: string;
  error?: string;
}

let transporterInstance: Transporter | null = null;

/**
 * Configure or retrieve the active Nodemailer transporter
 */
export function getEmailTransporter(): Transporter | null {
  if (transporterInstance) return transporterInstance;

  const host = process.env.SMTP_HOST?.trim();
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS?.trim();
  const secure = process.env.SMTP_SECURE === 'true' || port === 465;

  if (host) {
    transporterInstance = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: user ? { user, pass } : undefined,
    });
    return transporterInstance;
  }

  return null;
}

/**
 * Test override for automated test suites
 */
export function setTestTransporter(custom: Transporter | null): void {
  transporterInstance = custom;
}

/**
 * Dispatch an email message through real SMTP or verified test transport
 */
export async function sendEmail(options: EmailOptions): Promise<EmailDeliveryResult> {
  const from = process.env.SMTP_FROM || 'Pulse News Network <no-reply@pulsenews.global>';
  const transporter = getEmailTransporter();

  if (transporter) {
    try {
      const info = await transporter.sendMail({
        from,
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
      });
      return {
        success: true,
        messageId: info.messageId || `smtp-${Date.now()}`,
      };
    } catch (err: any) {
      console.error(`[Email Service] Live SMTP delivery failure to ${options.to}:`, err.message);
      return {
        success: false,
        messageId: '',
        error: `SMTP delivery failed: ${err.message}`,
      };
    }
  }

  // Production requirement: Never pretend email was sent if SMTP is unconfigured
  if (process.env.NODE_ENV === 'production') {
    const errorMsg = 'SMTP transport is not configured. Email cannot be delivered.';
    console.error(`[Email Service] Production Alert: ${errorMsg}`);
    return {
      success: false,
      messageId: '',
      error: errorMsg,
    };
  }

  // Development & Test Sandbox Delivery:
  const messageId = `sandbox-${Date.now()}-${crypto.randomBytes(6).toString('hex')}`;
  console.log(`[Email Service - Dev Sandbox] Simulated Delivery:`);
  console.log(`  To: ${options.to}`);
  console.log(`  From: ${from}`);
  console.log(`  Subject: ${options.subject}`);
  console.log(`  Message ID: ${messageId}`);

  return { success: true, messageId };
}

/**
 * Dispatch Password Recovery Email with Single-Use Hashed Token
 */
export async function sendPasswordResetEmail(
  to: string,
  resetToken: string,
  appUrl: string = 'http://localhost:5173'
): Promise<EmailDeliveryResult> {
  const cleanAppUrl = appUrl.replace(/\/$/, '');
  const resetLink = `${cleanAppUrl}/login?resetToken=${encodeURIComponent(resetToken)}`;

  const subject = 'Pulse News Network — Password Recovery Request';

  const text = `
Pulse News Network — Security Alert

We received a request to reset your password. Use the following link to choose a new password:
${resetLink}

This link is valid for 1 hour and can only be used once. If you did not request this change, you can safely ignore this email.

— Pulse News Network Security Desk
`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${subject}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px;">
  <div style="max-width: 560px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; padding: 32px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
    <div style="border-bottom: 2px solid #0284c7; padding-bottom: 16px; margin-bottom: 24px;">
      <h2 style="margin: 0; color: #0f172a; font-size: 20px; font-weight: 700;">PULSE NEWS NETWORK</h2>
      <p style="margin: 4px 0 0 0; color: #64748b; font-size: 12px; letter-spacing: 0.05em; text-transform: uppercase;">Security &amp; Identity Architecture</p>
    </div>
    
    <p style="color: #334155; font-size: 14px; line-height: 1.6;">Hello,</p>
    <p style="color: #334155; font-size: 14px; line-height: 1.6;">
      We received a request to reset your password. Click the secure button below to choose a new password. This link is single-use and expires in 60 minutes.
    </p>

    <div style="text-align: center; margin: 32px 0;">
      <a href="${resetLink}" style="background-color: #0284c7; color: #ffffff; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-size: 14px; font-weight: 600; display: inline-block;">
        Reset Account Password
      </a>
    </div>

    <p style="color: #64748b; font-size: 12px; line-height: 1.5;">
      If you did not request a password reset, no action is required. Your account remains secure.
    </p>

    <div style="border-top: 1px solid #e2e8f0; margin-top: 24px; padding-top: 16px; color: #94a3b8; font-size: 11px;">
      Pulse News Network • Cryptographic Identity Management • Real-Time Eyewitness Journalism
    </div>
  </div>
</body>
</html>
`;

  return sendEmail({ to, subject, text, html });
}

/**
 * Dispatch Email Address Verification Email
 */
export async function sendEmailVerificationEmail(
  to: string,
  verificationToken: string,
  appUrl: string = 'http://localhost:5173'
): Promise<EmailDeliveryResult> {
  const cleanAppUrl = appUrl.replace(/\/$/, '');
  const verifyLink = `${cleanAppUrl}/verify-email?token=${encodeURIComponent(verificationToken)}`;

  const subject = 'Pulse News Network — Verify Your Email Address';

  const text = `
Pulse News Network — Email Verification

Thank you for registering with Pulse News. Please confirm your email address by visiting:
${verifyLink}

This link expires in 24 hours.

— Pulse News Network Security Desk
`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${subject}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px;">
  <div style="max-width: 560px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; padding: 32px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
    <div style="border-bottom: 2px solid #0284c7; padding-bottom: 16px; margin-bottom: 24px;">
      <h2 style="margin: 0; color: #0f172a; font-size: 20px; font-weight: 700;">PULSE NEWS NETWORK</h2>
      <p style="margin: 4px 0 0 0; color: #64748b; font-size: 12px; letter-spacing: 0.05em; text-transform: uppercase;">Identity Verification</p>
    </div>
    
    <p style="color: #334155; font-size: 14px; line-height: 1.6;">Hello,</p>
    <p style="color: #334155; font-size: 14px; line-height: 1.6;">
      Thank you for creating an account on Pulse News Network. Please click the button below to verify your email address:
    </p>

    <div style="text-align: center; margin: 32px 0;">
      <a href="${verifyLink}" style="background-color: #0284c7; color: #ffffff; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-size: 14px; font-weight: 600; display: inline-block;">
        Verify Email Address
      </a>
    </div>

    <div style="border-top: 1px solid #e2e8f0; margin-top: 24px; padding-top: 16px; color: #94a3b8; font-size: 11px;">
      Pulse News Network • Cryptographic Identity Management • Real-Time Eyewitness Journalism
    </div>
  </div>
</body>
</html>
`;

  return sendEmail({ to, subject, text, html });
}
