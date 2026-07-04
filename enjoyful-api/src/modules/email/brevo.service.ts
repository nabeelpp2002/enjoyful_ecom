import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface BrevoRecipient {
  email: string;
  name?: string;
}

export interface SendEmailParams {
  to: BrevoRecipient[];
  subject: string;
  htmlContent: string;
  textContent?: string;
}

/**
 * Thin wrapper around Brevo's transactional email API.
 * Docs: https://developers.brevo.com/reference/sendtransacemail
 */
@Injectable()
export class BrevoService {
  private readonly logger = new Logger(BrevoService.name);
  private readonly apiKey: string;
  private readonly fromEmail: string;
  private readonly fromName: string;
  private readonly adminEmail: string;
  private readonly endpoint = 'https://api.brevo.com/v3/smtp/email';

  constructor(config: ConfigService) {
    this.apiKey = config.get<string>('BREVO_API_KEY', '');
    this.fromEmail = config.get<string>('BREVO_FROM_EMAIL', 'no-reply@enjoyfullife.com');
    this.fromName = config.get<string>('BREVO_FROM_NAME', 'enJoyful Life');
    // Admin inbox for contact-form forwarding. Falls back to the sender address.
    this.adminEmail = config.get<string>('ADMIN_SEED_EMAIL', this.fromEmail);
  }

  async send(params: SendEmailParams): Promise<void> {
    if (!this.apiKey) {
      this.logger.warn('BREVO_API_KEY missing — emails are disabled. Set it in .env to enable.');
      throw new ServiceUnavailableException('Email service not configured');
    }

    const body = {
      sender: { email: this.fromEmail, name: this.fromName },
      to: params.to,
      subject: params.subject,
      htmlContent: params.htmlContent,
      textContent: params.textContent,
    };

    const res = await fetch(this.endpoint, {
      method: 'POST',
      headers: {
        'api-key': this.apiKey,
        'Content-Type': 'application/json',
        accept: 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      this.logger.error(`Brevo send failed: HTTP ${res.status} — ${errText}`);
      throw new ServiceUnavailableException('Failed to send email');
    }
  }

  /** Forward a website contact-form submission to the store admin inbox. */
  async sendContactForm(
    name: string,
    email: string,
    subject: string | undefined,
    message: string,
  ): Promise<void> {
    const displaySubject = subject?.trim() || 'New contact form submission';
    const html = contactFormTemplate(name, email, displaySubject, message);
    await this.send({
      to: [{ email: this.adminEmail, name: 'enJoyful Life Admin' }],
      subject: `[Contact] ${displaySubject}`,
      htmlContent: html,
      textContent: `Name: ${name}\nEmail: ${email}\nSubject: ${displaySubject}\n\n${message}`,
    });
  }

  /** Convenience: 6-digit OTP code email. */
  async sendOtp(email: string, code: string, ttlMinutes: number): Promise<void> {
    const html = otpTemplate(code, ttlMinutes);
    await this.send({
      to: [{ email }],
      subject: `Your enJoyful Life sign-in code: ${code}`,
      htmlContent: html,
      textContent: `Your enJoyful Life sign-in code is ${code}. It expires in ${ttlMinutes} minutes.`,
    });
  }
}

function contactFormTemplate(
  name: string,
  email: string,
  subject: string,
  message: string,
): string {
  const safeMessage = message.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>');
  return `<!doctype html>
<html><body style="margin:0;padding:0;background:#F9F5F0;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif;color:#1A1A1B;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F9F5F0;padding:32px 16px;">
  <tr><td align="center">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#fff;border-radius:24px;padding:36px 32px;box-shadow:0 6px 28px rgba(26,26,27,0.06);">
      <tr><td>
        <h1 style="margin:0 0 4px;font-size:20px;font-weight:700;letter-spacing:-0.01em;color:#735697;">New Contact Form Message</h1>
        <p style="margin:0 0 24px;color:rgba(26,26,27,0.5);font-size:12px;">Submitted via the enJoyful Life website</p>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;background:#F9F5F0;border-radius:12px;padding:16px;">
          <tr><td style="padding:4px 0;font-size:13px;color:rgba(26,26,27,0.6);width:70px;">From</td><td style="padding:4px 0;font-size:13px;font-weight:600;">${name}</td></tr>
          <tr><td style="padding:4px 0;font-size:13px;color:rgba(26,26,27,0.6);">Email</td><td style="padding:4px 0;font-size:13px;"><a href="mailto:${email}" style="color:#735697;text-decoration:none;">${email}</a></td></tr>
          <tr><td style="padding:4px 0;font-size:13px;color:rgba(26,26,27,0.6);">Subject</td><td style="padding:4px 0;font-size:13px;">${subject}</td></tr>
        </table>
        <div style="font-size:14px;line-height:1.65;color:#1A1A1B;border-left:3px solid #735697;padding-left:16px;">${safeMessage}</div>
      </td></tr>
    </table>
    <p style="margin:16px 0 0;color:rgba(26,26,27,0.4);font-size:11px;">enJoyful Life · Premium skincare &amp; lifestyle</p>
  </td></tr>
</table>
</body></html>`;
}

function otpTemplate(code: string, ttlMinutes: number): string {
  return `<!doctype html>
<html><body style="margin:0;padding:0;background:#F9F5F0;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif;color:#1A1A1B;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F9F5F0;padding:32px 16px;">
  <tr><td align="center">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#fff;border-radius:24px;padding:36px 32px;box-shadow:0 6px 28px rgba(26,26,27,0.06);">
      <tr><td>
        <h1 style="margin:0 0 12px;font-size:22px;font-weight:700;letter-spacing:-0.01em;">Your sign-in code</h1>
        <p style="margin:0 0 24px;color:rgba(26,26,27,0.65);font-size:14px;line-height:1.55;">
          Use the code below to sign in to your enJoyful Life account. It expires in ${ttlMinutes} minutes and can only be used once.
        </p>
        <div style="background:#F9F5F0;border:1px solid rgba(0,0,0,0.05);border-radius:16px;padding:20px;text-align:center;margin-bottom:24px;">
          <div style="font-size:36px;font-weight:700;letter-spacing:0.32em;font-family:Menlo,Consolas,monospace;color:#735697;">${code}</div>
        </div>
        <p style="margin:0;color:rgba(26,26,27,0.5);font-size:12px;line-height:1.5;">
          If you didn't request this code, you can safely ignore this email — someone may have typed your address by mistake.
        </p>
      </td></tr>
    </table>
    <p style="margin:16px 0 0;color:rgba(26,26,27,0.4);font-size:11px;">enJoyful Life · Premium skincare &amp; lifestyle</p>
  </td></tr>
</table>
</body></html>`;
}
