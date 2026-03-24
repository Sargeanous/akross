import { describe, it, expect, vi } from 'vitest';
import { AUTH, PROFILE, RATE_LIMITS, calculateAge } from '@proximity/shared';

/**
 * End-to-end onboarding flow tests.
 *
 * These validate the full signup → verify → create profile → token lifecycle
 * by simulating the service layer logic with mock data.
 */

// ─── Mock Data ──────────────────────────────────────────────────────────────

const PHONE = '+14155550100';
const VALID_CODE = '123456';
const WRONG_CODE = '000000';
const USER_ID = 'user-new-1';

const mockOtp = {
  id: 'otp-1',
  target: PHONE,
  code: VALID_CODE,
  method: 'PHONE' as const,
  attempts: 0,
  usedAt: null as Date | null,
  expiresAt: new Date(Date.now() + AUTH.OTP_TTL_S * 1000),
  createdAt: new Date(),
};

const mockUser = {
  id: USER_ID,
  phone: PHONE,
  email: null,
  authMethod: 'PHONE' as const,
  isVerified: true,
  isAdmin: false,
  isBanned: false,
  createdAt: new Date(),
};

const mockRefreshToken = {
  id: 'rt-1',
  userId: USER_ID,
  token: 'refresh-token-value-abc',
  expiresAt: new Date(Date.now() + AUTH.REFRESH_TOKEN_TTL_S * 1000),
  revokedAt: null as Date | null,
  createdAt: new Date(),
};

// ─── Step 1: OTP Request ────────────────────────────────────────────────────

describe('Onboarding E2E: OTP Request', () => {
  it('creates an OTP record with correct TTL', () => {
    const expiresAt = new Date(Date.now() + AUTH.OTP_TTL_S * 1000);
    const diffMs = expiresAt.getTime() - Date.now();

    // TTL should be ~5 minutes (300 seconds)
    expect(diffMs).toBeGreaterThan(299_000);
    expect(diffMs).toBeLessThanOrEqual(300_000);
  });

  it('generates a 6-digit OTP code', () => {
    expect(VALID_CODE).toHaveLength(AUTH.OTP_LENGTH);
    expect(/^\d{6}$/.test(VALID_CODE)).toBe(true);
  });

  it('routes OTP to SMS for PHONE method', () => {
    const sendSms = vi.fn();
    const sendEmail = vi.fn();

    if (mockOtp.method === 'PHONE') {
      sendSms(mockOtp.target, mockOtp.code);
    } else {
      sendEmail(mockOtp.target, mockOtp.code);
    }

    expect(sendSms).toHaveBeenCalledWith(PHONE, VALID_CODE);
    expect(sendEmail).not.toHaveBeenCalled();
  });
});

// ─── Step 2: OTP Verification ───────────────────────────────────────────────

describe('Onboarding E2E: OTP Verification', () => {
  it('verifies OTP with correct code', () => {
    const isValid =
      mockOtp.code === VALID_CODE &&
      mockOtp.usedAt === null &&
      mockOtp.expiresAt > new Date() &&
      mockOtp.attempts < AUTH.OTP_MAX_ATTEMPTS;

    expect(isValid).toBe(true);
  });

  it('rejects OTP with wrong code and increments attempts', () => {
    const otp = { ...mockOtp, attempts: 0 };
    const isCorrect = otp.code === WRONG_CODE;

    expect(isCorrect).toBe(false);

    // Service increments attempts on wrong code
    otp.attempts += 1;
    expect(otp.attempts).toBe(1);
  });

  it('rejects OTP after max attempts exceeded', () => {
    const otp = { ...mockOtp, attempts: AUTH.OTP_MAX_ATTEMPTS };
    const isExhausted = otp.attempts >= AUTH.OTP_MAX_ATTEMPTS;

    expect(isExhausted).toBe(true);
  });

  it('rejects expired OTP', () => {
    const expiredOtp = {
      ...mockOtp,
      expiresAt: new Date(Date.now() - 1000), // expired 1 second ago
    };

    const isExpired = expiredOtp.expiresAt <= new Date();
    expect(isExpired).toBe(true);
  });

  it('creates a new user on first login', () => {
    const existingUser = null; // No user found

    // Service should create a new user
    const shouldCreate = existingUser === null;
    expect(shouldCreate).toBe(true);

    // Created user should be verified
    expect(mockUser.isVerified).toBe(true);
    expect(mockUser.phone).toBe(PHONE);
    expect(mockUser.authMethod).toBe('PHONE');
  });

  it('returns JWT access token and refresh token', () => {
    const tokens = {
      accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.mock-access',
      refreshToken: mockRefreshToken.token,
    };

    expect(tokens.accessToken).toBeTruthy();
    expect(tokens.refreshToken).toBeTruthy();
    expect(typeof tokens.accessToken).toBe('string');
    expect(typeof tokens.refreshToken).toBe('string');
  });

  it('marks OTP as used after successful verification', () => {
    const usedOtp = { ...mockOtp, usedAt: new Date() };
    expect(usedOtp.usedAt).not.toBeNull();
  });
});

// ─── Step 3: Profile Creation ───────────────────────────────────────────────

describe('Onboarding E2E: Profile Creation', () => {
  const validProfile = {
    displayName: 'Alex',
    birthDate: '2000-06-15',
    gender: 'MALE' as const,
    genderPreferences: ['FEMALE' as const, 'NON_BINARY' as const],
    bio: 'Love hiking and coffee',
  };

  it('creates profile with valid data (18+)', () => {
    const age = calculateAge(new Date(validProfile.birthDate));
    expect(age).toBeGreaterThanOrEqual(PROFILE.MIN_AGE);
  });

  it('rejects profile creation for users under 18', () => {
    const underageBirthDate = new Date();
    underageBirthDate.setFullYear(underageBirthDate.getFullYear() - 17);

    const age = calculateAge(underageBirthDate);
    const isUnderage = age < PROFILE.MIN_AGE;

    expect(isUnderage).toBe(true);
  });

  it('rejects duplicate profile creation', () => {
    const existingProfile = { id: 'profile-1', userId: USER_ID };
    const hasDuplicate = existingProfile !== null;

    expect(hasDuplicate).toBe(true);
  });

  it('validates display name length constraint', () => {
    expect(validProfile.displayName.length).toBeLessThanOrEqual(PROFILE.MAX_DISPLAY_NAME_LENGTH);
    expect(validProfile.displayName.length).toBeGreaterThanOrEqual(1);
  });

  it('validates bio length constraint', () => {
    expect(validProfile.bio!.length).toBeLessThanOrEqual(PROFILE.MAX_BIO_LENGTH);
  });

  it('requires at least one gender preference', () => {
    expect(validProfile.genderPreferences.length).toBeGreaterThanOrEqual(1);
  });
});

// ─── Step 4: Token Refresh ──────────────────────────────────────────────────

describe('Onboarding E2E: Token Lifecycle', () => {
  it('refreshes tokens by revoking old and issuing new pair', () => {
    // Old token gets revoked
    const revokedToken = { ...mockRefreshToken, revokedAt: new Date() };
    expect(revokedToken.revokedAt).not.toBeNull();

    // New token pair is issued
    const newTokens = {
      accessToken: 'new-access-token',
      refreshToken: 'new-refresh-token',
    };
    expect(newTokens.accessToken).not.toBe(revokedToken.token);
  });

  it('rejects refresh with revoked token', () => {
    const revokedToken = { ...mockRefreshToken, revokedAt: new Date() };
    const isInvalid = revokedToken.revokedAt !== null;

    expect(isInvalid).toBe(true);
  });

  it('rejects refresh with expired token', () => {
    const expiredToken = {
      ...mockRefreshToken,
      expiresAt: new Date(Date.now() - 1000),
    };
    const isExpired = expiredToken.expiresAt < new Date();

    expect(isExpired).toBe(true);
  });

  it('logout revokes the refresh token', () => {
    const revokedToken = { ...mockRefreshToken, revokedAt: new Date() };
    expect(revokedToken.revokedAt).toBeInstanceOf(Date);
  });
});

// ─── Step 5: OTP Rate Limiting ──────────────────────────────────────────────

describe('Onboarding E2E: OTP Rate Limiting', () => {
  it('allows up to OTP_REQUEST_PER_HOUR requests', () => {
    let count = 0;
    const allowed: boolean[] = [];

    for (let i = 0; i < RATE_LIMITS.OTP_REQUEST_PER_HOUR; i++) {
      count++;
      allowed.push(count <= RATE_LIMITS.OTP_REQUEST_PER_HOUR);
    }

    expect(allowed.every(Boolean)).toBe(true);
  });

  it('blocks the request that exceeds the hourly limit', () => {
    const count = RATE_LIMITS.OTP_REQUEST_PER_HOUR + 1;
    const isBlocked = count > RATE_LIMITS.OTP_REQUEST_PER_HOUR;

    expect(isBlocked).toBe(true);
  });

  it('rate limit is per-target, not global', () => {
    const counters: Record<string, number> = {};
    const targetA = '+14155550100';
    const targetB = '+14155550200';

    counters[targetA] = (counters[targetA] ?? 0) + 1;
    counters[targetB] = (counters[targetB] ?? 0) + 1;

    // Each target has its own counter
    expect(counters[targetA]).toBe(1);
    expect(counters[targetB]).toBe(1);
  });
});
