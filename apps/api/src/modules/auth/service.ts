import crypto from 'node:crypto';
import { AUTH } from '@proximity/shared';
import { getPrisma } from '../../config/prisma.js';
import { getEnv } from '../../config/env.js';
import type { AuthMethod } from '@prisma/client';

const prisma = getPrisma();

/**
 * Generate a random numeric OTP of the configured length.
 */
function generateOtp(): string {
  const max = Math.pow(10, AUTH.OTP_LENGTH);
  return crypto.randomInt(0, max).toString().padStart(AUTH.OTP_LENGTH, '0');
}

/**
 * Generate a cryptographically random token for refresh tokens and magic links.
 */
function generateSecureToken(): string {
  return crypto.randomBytes(48).toString('base64url');
}

// ─── OTP Providers (stubbed) ─────────────────────────────────────────────────
// In production, swap these out for Twilio / SendGrid / etc.

async function sendSmsOtp(phone: string, code: string): Promise<void> {
  // Stub: log to console in development
  console.log(`[OTP-SMS] Sending code ${code} to ${phone}`);
}

async function sendEmailMagicLink(email: string, code: string): Promise<void> {
  // Stub: log to console. In production, send an email with a deep link
  // that includes the code as a query parameter.
  console.log(`[OTP-EMAIL] Sending magic link code ${code} to ${email}`);
}

// ─── Service Functions ───────────────────────────────────────────────────────

export async function requestOtp(target: string, method: AuthMethod) {
  const code = generateOtp();
  const expiresAt = new Date(Date.now() + AUTH.OTP_TTL_S * 1000);

  await prisma.otpCode.create({
    data: { target, code, method, expiresAt },
  });

  if (method === 'PHONE') {
    await sendSmsOtp(target, code);
  } else {
    await sendEmailMagicLink(target, code);
  }

  return { sent: true };
}

export async function verifyOtp(target: string, code: string, method: AuthMethod) {
  const otp = await prisma.otpCode.findFirst({
    where: {
      target,
      method,
      usedAt: null,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: 'desc' },
  });

  if (!otp) {
    throw new OtpError('No valid OTP found. Request a new one.');
  }

  if (otp.attempts >= AUTH.OTP_MAX_ATTEMPTS) {
    throw new OtpError('Maximum verification attempts exceeded. Request a new code.');
  }

  if (otp.code !== code) {
    await prisma.otpCode.update({
      where: { id: otp.id },
      data: { attempts: { increment: 1 } },
    });
    throw new OtpError('Invalid code.');
  }

  // Mark OTP as used
  await prisma.otpCode.update({
    where: { id: otp.id },
    data: { usedAt: new Date() },
  });

  // Find or create user
  const whereClause = method === 'PHONE' ? { phone: target } : { email: target };
  let user = await prisma.user.findFirst({ where: whereClause });

  if (!user) {
    user = await prisma.user.create({
      data: {
        ...(method === 'PHONE' ? { phone: target } : { email: target }),
        authMethod: method,
        isVerified: true,
      },
    });
  } else if (!user.isVerified) {
    user = await prisma.user.update({
      where: { id: user.id },
      data: { isVerified: true },
    });
  }

  // Generate token pair
  const tokens = await createTokenPair(user.id);
  return { user, tokens };
}

export async function createTokenPair(userId: string) {
  const env = getEnv();
  const { default: jwt } = await import('jsonwebtoken');

  const accessToken = jwt.sign({ sub: userId }, env.JWT_SECRET, {
    expiresIn: AUTH.ACCESS_TOKEN_TTL_S,
  });

  const refreshTokenValue = generateSecureToken();
  const expiresAt = new Date(Date.now() + AUTH.REFRESH_TOKEN_TTL_S * 1000);

  await prisma.refreshToken.create({
    data: {
      userId,
      token: refreshTokenValue,
      expiresAt,
    },
  });

  return { accessToken, refreshToken: refreshTokenValue };
}

export async function refreshAccessToken(refreshTokenValue: string) {
  const record = await prisma.refreshToken.findUnique({
    where: { token: refreshTokenValue },
  });

  if (!record || record.revokedAt || record.expiresAt < new Date()) {
    throw new AuthError('Invalid or expired refresh token.');
  }

  // Rotate: revoke old, issue new pair
  await prisma.refreshToken.update({
    where: { id: record.id },
    data: { revokedAt: new Date() },
  });

  return createTokenPair(record.userId);
}

export async function revokeRefreshToken(refreshTokenValue: string) {
  await prisma.refreshToken.updateMany({
    where: { token: refreshTokenValue, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

// ─── Error Classes ───────────────────────────────────────────────────────────

export class OtpError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'OtpError';
  }
}

export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthError';
  }
}
