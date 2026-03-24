import { getEnv } from '../config/env.js';

// ─── Provider Interface ──────────────────────────────────────────────────────

export interface OtpProvider {
  sendSms(phone: string, code: string): Promise<void>;
  sendEmail(email: string, code: string): Promise<void>;
}

// ─── Console Provider (development) ──────────────────────────────────────────

class ConsoleOtpProvider implements OtpProvider {
  async sendSms(phone: string, code: string): Promise<void> {
    console.log(`\n╔══════════════════════════════════════╗`);
    console.log(`║  OTP CODE: ${code}                    ║`);
    console.log(`║  Phone: ${phone.padEnd(28)}║`);
    console.log(`╚══════════════════════════════════════╝\n`);
  }

  async sendEmail(email: string, code: string): Promise<void> {
    console.log(`\n╔══════════════════════════════════════╗`);
    console.log(`║  MAGIC LINK CODE: ${code}             ║`);
    console.log(`║  Email: ${email.padEnd(28)}║`);
    console.log(`╚══════════════════════════════════════╝\n`);
  }
}

// ─── Twilio Provider (production SMS) ────────────────────────────────────────
// Uncomment and configure when ready to send real SMS via Twilio.
//
// class TwilioOtpProvider implements OtpProvider {
//   private accountSid: string;
//   private authToken: string;
//   private fromNumber: string;
//
//   constructor() {
//     this.accountSid = process.env.TWILIO_ACCOUNT_SID!;
//     this.authToken = process.env.TWILIO_AUTH_TOKEN!;
//     this.fromNumber = process.env.TWILIO_FROM_NUMBER!;
//   }
//
//   async sendSms(phone: string, code: string): Promise<void> {
//     const url = `https://api.twilio.com/2010-04-01/Accounts/${this.accountSid}/Messages.json`;
//     await fetch(url, {
//       method: 'POST',
//       headers: {
//         'Authorization': `Basic ${Buffer.from(`${this.accountSid}:${this.authToken}`).toString('base64')}`,
//         'Content-Type': 'application/x-www-form-urlencoded',
//       },
//       body: new URLSearchParams({
//         To: phone,
//         From: this.fromNumber,
//         Body: `Your Proximity verification code is: ${code}`,
//       }),
//     });
//   }
//
//   async sendEmail(_email: string, _code: string): Promise<void> {
//     throw new Error('Twilio provider does not support email. Use Resend/SendGrid.');
//   }
// }

// ─── Resend Provider (production email) ──────────────────────────────────────
// Uncomment and configure when ready to send real emails via Resend.
//
// class ResendOtpProvider implements OtpProvider {
//   private apiKey: string;
//   private fromEmail: string;
//
//   constructor() {
//     this.apiKey = process.env.RESEND_API_KEY!;
//     this.fromEmail = process.env.RESEND_FROM_EMAIL ?? 'noreply@proximity.app';
//   }
//
//   async sendSms(_phone: string, _code: string): Promise<void> {
//     throw new Error('Resend provider does not support SMS. Use Twilio.');
//   }
//
//   async sendEmail(email: string, code: string): Promise<void> {
//     await fetch('https://api.resend.com/emails', {
//       method: 'POST',
//       headers: {
//         'Authorization': `Bearer ${this.apiKey}`,
//         'Content-Type': 'application/json',
//       },
//       body: JSON.stringify({
//         from: this.fromEmail,
//         to: email,
//         subject: 'Your Proximity login code',
//         html: `<p>Your verification code is: <strong>${code}</strong></p><p>This code expires in 5 minutes.</p>`,
//       }),
//     });
//   }
// }

// ─── Factory ─────────────────────────────────────────────────────────────────

let _provider: OtpProvider | null = null;

export function getOtpProvider(): OtpProvider {
  if (_provider) return _provider;

  const env = getEnv();
  switch (env.OTP_PROVIDER) {
    // case 'twilio':
    //   _provider = new TwilioOtpProvider();
    //   break;
    // case 'resend':
    //   _provider = new ResendOtpProvider();
    //   break;
    case 'console':
    default:
      _provider = new ConsoleOtpProvider();
  }
  return _provider;
}
