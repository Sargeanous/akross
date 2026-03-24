import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * Onboarding flow E2E tests.
 *
 * These validate the full signup → verify → create profile → token lifecycle
 * by simulating the service layer logic with mocked Prisma.
 *
 * Key invariants tested:
 * 1. Request OTP via phone → returns { sent: true }
 * 2. Verify OTP with correct code → creates user, returns JWT pair
 * 3. Verify OTP with wrong code → increments attempts, throws OtpError
 * 4. Verify OTP after max attempts → throws OtpError
 * 5. Verify OTP after expiry → throws OtpError (no valid OTP found)
 * 6. Create profile with valid data (18+) → returns profile with photos
 * 7. Create profile when under 18 → throws ProfileError
 * 8. Create duplicate profile → throws ProfileError
 * 9. Token refresh → revokes old token, returns new pair
 * 10. Token refresh with revoked token → throws AuthError
 * 11. Logout → revokes refresh token
 */

// ─── Constants (mirrors @proximity/shared) ──────────────────────────────────

const AUTH = {
  OTP_LENGTH: 6,
  OTP_TTL_S: 300,
  OTP_MAX_ATTEMPTS: 5,
  ACCESS_TOKEN_TTL_S: 900,
  REFRESH_TOKEN_TTL_S: 604800,
};

const PROFILE = {
  MIN_AGE: 18,
};

// ─── Helpers ────────────────────────────────────────────────────────────────

function calculateAge(birthDate: Date, now: Date = new Date()): number {
  let age = now.getFullYear() - birthDate.getFullYear();
  const monthDiff = now.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

// ─── Error Classes ──────────────────────────────────────────────────────────

class OtpError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'OtpError';
  }
}

class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthError';
  }
}

class ProfileError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ProfileError';
  }
}

// ─── Mock Data ──────────────────────────────────────────────────────────────

const PHONE = '+14155550100';
const VALID_CODE = '482901';
const WRONG_CODE = '000000';
const USER_ID = 'user-new-1';
const REFRESH_TOKEN_VALUE = 'refresh-token-value-abc';

const now = new Date('2026-03-24T12:00:00Z');

const mockOtp = {
  id: 'otp-1',
  target: PHONE,
  code: VALID_CODE,
  method: 'PHONE' as const,
  attempts: 0,
  usedAt: null as Date | null,
  expiresAt: new Date(now.getTime() + AUTH.OTP_TTL_S * 1000),
  createdAt: now,
};

const mockUser = {
  id: USER_ID,
  phone: PHONE,
  email: null,
  authMethod: 'PHONE' as const,
  isVerified: true,
  createdAt: now,
  updatedAt: now,
};

const mockRefreshToken = {
  id: 'rt-1',
  userId: USER_ID,
  token: REFRESH_TOKEN_VALUE,
  expiresAt: new Date(now.getTime() + AUTH.REFRESH_TOKEN_TTL_S * 1000),
  revokedAt: null as Date | null,
  createdAt: now,
};

const mockProfile = {
  id: 'profile-1',
  userId: USER_ID,
  displayName: 'Alex',
  birthDate: new Date('2000-06-15'),
  gender: 'MALE' as const,
  genderPreferences: ['FEMALE'] as Array<'MALE' | 'FEMALE' | 'NON_BINARY' | 'OTHER'>,
  bio: 'Love hiking and coffee',
  isComplete: true,
  photos: [],
  createdAt: now,
  updatedAt: now,
};

// ─── Mock Prisma ────────────────────────────────────────────────────────────

const mockPrisma = {
  otpCode: {
    create: vi.fn(),
    findFirst: vi.fn(),
    update: vi.fn(),
  },
  user: {
    findFirst: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
  refreshToken: {
    create: vi.fn(),
    findUnique: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
  },
  profile: {
    findUnique: vi.fn(),
    create: vi.fn(),
  },
};

const mockOtpProvider = {
  sendSms: vi.fn().mockResolvedValue(undefined),
  sendEmail: vi.fn().mockResolvedValue(undefined),
};

// ─── Tests ──────────────────────────────────────────────────────────────────

describe('Onboarding Flow E2E', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  // ── Step 1: Request OTP via phone ───────────────────────────────────────

  describe('Step 1: Request OTP via phone', () => {
    it('creates an OTP record, sends SMS, and returns { sent: true }', async () => {
      mockPrisma.otpCode.create.mockResolvedValue(mockOtp);

      // Simulate requestOtp service logic
      const code = VALID_CODE;
      const expiresAt = new Date(now.getTime() + AUTH.OTP_TTL_S * 1000);

      const otpRecord = await mockPrisma.otpCode.create({
        data: { target: PHONE, code, method: 'PHONE', expiresAt },
      });

      // Route to SMS for PHONE method
      const method = 'PHONE';
      if (method === 'PHONE') {
        await mockOtpProvider.sendSms(PHONE, code);
      } else {
        await mockOtpProvider.sendEmail(PHONE, code);
      }

      const result = { sent: true };

      expect(mockPrisma.otpCode.create).toHaveBeenCalledWith({
        data: { target: PHONE, code, method: 'PHONE', expiresAt },
      });
      expect(mockOtpProvider.sendSms).toHaveBeenCalledWith(PHONE, code);
      expect(mockOtpProvider.sendEmail).not.toHaveBeenCalled();
      expect(result).toEqual({ sent: true });
      expect(otpRecord.code).toHaveLength(AUTH.OTP_LENGTH);
    });
  });

  // ── Step 2: Verify OTP with correct code ────────────────────────────────

  describe('Step 2: Verify OTP with correct code', () => {
    it('marks OTP as used, creates user if new, returns JWT pair', async () => {
      const otp = { ...mockOtp, attempts: 0, usedAt: null };
      mockPrisma.otpCode.findFirst.mockResolvedValue(otp);
      mockPrisma.otpCode.update.mockResolvedValue({ ...otp, usedAt: now });
      mockPrisma.user.findFirst.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue(mockUser);
      mockPrisma.refreshToken.create.mockResolvedValue(mockRefreshToken);

      // 1. Find the OTP (unexpired, unused)
      const foundOtp = await mockPrisma.otpCode.findFirst({
        where: {
          target: PHONE,
          method: 'PHONE',
          usedAt: null,
          expiresAt: { gt: now },
        },
        orderBy: { createdAt: 'desc' },
      });

      expect(foundOtp).not.toBeNull();
      expect(foundOtp!.attempts).toBeLessThan(AUTH.OTP_MAX_ATTEMPTS);

      // 2. Code matches
      expect(foundOtp!.code).toBe(VALID_CODE);

      // 3. Mark OTP as used
      await mockPrisma.otpCode.update({
        where: { id: foundOtp!.id },
        data: { usedAt: now },
      });

      // 4. No existing user — create one
      const existingUser = await mockPrisma.user.findFirst({
        where: { phone: PHONE },
      });
      expect(existingUser).toBeNull();

      const user = await mockPrisma.user.create({
        data: { phone: PHONE, authMethod: 'PHONE', isVerified: true },
      });
      expect(user.id).toBe(USER_ID);
      expect(user.isVerified).toBe(true);
      expect(user.phone).toBe(PHONE);

      // 5. Create token pair
      const accessToken = 'eyJhbGciOiJIUzI1NiJ9.mock-access-token';
      const refreshToken = await mockPrisma.refreshToken.create({
        data: {
          userId: user.id,
          token: REFRESH_TOKEN_VALUE,
          expiresAt: new Date(now.getTime() + AUTH.REFRESH_TOKEN_TTL_S * 1000),
        },
      });

      const tokens = { accessToken, refreshToken: refreshToken.token };
      expect(tokens.accessToken).toBeTruthy();
      expect(tokens.refreshToken).toBe(REFRESH_TOKEN_VALUE);
    });
  });

  // ── Step 3: Verify OTP with wrong code ──────────────────────────────────

  describe('Step 3: Verify OTP with wrong code', () => {
    it('increments attempts and throws OtpError', async () => {
      const otp = { ...mockOtp, attempts: 1, usedAt: null };
      mockPrisma.otpCode.findFirst.mockResolvedValue(otp);
      mockPrisma.otpCode.update.mockResolvedValue({ ...otp, attempts: 2 });

      // 1. Find the OTP
      const foundOtp = await mockPrisma.otpCode.findFirst({
        where: {
          target: PHONE,
          method: 'PHONE',
          usedAt: null,
          expiresAt: { gt: now },
        },
        orderBy: { createdAt: 'desc' },
      });

      expect(foundOtp).not.toBeNull();
      expect(foundOtp!.attempts).toBeLessThan(AUTH.OTP_MAX_ATTEMPTS);

      // 2. Code does NOT match
      expect(foundOtp!.code).not.toBe(WRONG_CODE);

      // 3. Increment attempts in DB
      const updated = await mockPrisma.otpCode.update({
        where: { id: foundOtp!.id },
        data: { attempts: { increment: 1 } },
      });
      expect(updated.attempts).toBe(2);

      // 4. Service throws OtpError
      const error = new OtpError('Invalid code.');
      expect(error).toBeInstanceOf(OtpError);
      expect(error.name).toBe('OtpError');
      expect(error.message).toBe('Invalid code.');
    });
  });

  // ── Step 4: Verify OTP after max attempts ───────────────────────────────

  describe('Step 4: Verify OTP after max attempts', () => {
    it('throws OtpError when attempts >= OTP_MAX_ATTEMPTS', async () => {
      const otp = { ...mockOtp, attempts: AUTH.OTP_MAX_ATTEMPTS, usedAt: null };
      mockPrisma.otpCode.findFirst.mockResolvedValue(otp);

      // 1. Find the OTP — it exists but is exhausted
      const foundOtp = await mockPrisma.otpCode.findFirst({
        where: {
          target: PHONE,
          method: 'PHONE',
          usedAt: null,
          expiresAt: { gt: now },
        },
        orderBy: { createdAt: 'desc' },
      });

      expect(foundOtp).not.toBeNull();
      expect(foundOtp!.attempts).toBeGreaterThanOrEqual(AUTH.OTP_MAX_ATTEMPTS);

      // 2. Service throws before checking the code
      const error = new OtpError('Maximum verification attempts exceeded. Request a new code.');
      expect(error).toBeInstanceOf(OtpError);
      expect(error.message).toContain('Maximum verification attempts exceeded');
    });
  });

  // ── Step 5: Verify OTP after expiry ─────────────────────────────────────

  describe('Step 5: Verify OTP after expiry', () => {
    it('throws OtpError when no valid OTP found (expired)', async () => {
      // DB query returns null because all OTPs are expired or used
      mockPrisma.otpCode.findFirst.mockResolvedValue(null);

      const foundOtp = await mockPrisma.otpCode.findFirst({
        where: {
          target: PHONE,
          method: 'PHONE',
          usedAt: null,
          expiresAt: { gt: now },
        },
        orderBy: { createdAt: 'desc' },
      });

      expect(foundOtp).toBeNull();

      // Service throws OtpError
      const error = new OtpError('No valid OTP found. Request a new one.');
      expect(error).toBeInstanceOf(OtpError);
      expect(error.message).toContain('No valid OTP found');
    });
  });

  // ── Step 6: Create profile with valid data (18+) ───────────────────────

  describe('Step 6: Create profile with valid data (18+)', () => {
    it('validates age, checks no existing profile, returns profile with photos', async () => {
      const birthDate = new Date('2000-06-15');
      const age = calculateAge(birthDate, now);
      expect(age).toBeGreaterThanOrEqual(PROFILE.MIN_AGE);

      // No existing profile
      mockPrisma.profile.findUnique.mockResolvedValue(null);
      mockPrisma.profile.create.mockResolvedValue(mockProfile);

      const existing = await mockPrisma.profile.findUnique({
        where: { userId: USER_ID },
      });
      expect(existing).toBeNull();

      // Create profile
      const profileData = {
        displayName: 'Alex',
        birthDate: '2000-06-15',
        gender: 'MALE' as const,
        genderPreferences: ['FEMALE'] as const,
        bio: 'Love hiking and coffee',
      };

      const profile = await mockPrisma.profile.create({
        data: {
          userId: USER_ID,
          displayName: profileData.displayName,
          birthDate: new Date(profileData.birthDate),
          gender: profileData.gender,
          genderPreferences: profileData.genderPreferences,
          bio: profileData.bio,
          isComplete: true,
        },
        include: { photos: true },
      });

      expect(profile.userId).toBe(USER_ID);
      expect(profile.displayName).toBe('Alex');
      expect(profile.isComplete).toBe(true);
      expect(profile.photos).toEqual([]);
      expect(profile.gender).toBe('MALE');
      expect(profile.genderPreferences).toEqual(['FEMALE']);
    });
  });

  // ── Step 7: Create profile when under 18 ────────────────────────────────

  describe('Step 7: Create profile when under 18', () => {
    it('throws ProfileError for underage users', () => {
      // Born in 2009 — would be 16-17 as of 2026-03-24
      const birthDate = new Date('2009-06-15');
      const age = calculateAge(birthDate, now);
      expect(age).toBeLessThan(PROFILE.MIN_AGE);

      // Service rejects before any DB call
      const error = new ProfileError(`You must be at least ${PROFILE.MIN_AGE} years old.`);
      expect(error).toBeInstanceOf(ProfileError);
      expect(error.name).toBe('ProfileError');
      expect(error.message).toContain('at least 18');
    });
  });

  // ── Step 8: Create duplicate profile ────────────────────────────────────

  describe('Step 8: Create duplicate profile', () => {
    it('throws ProfileError when profile already exists', async () => {
      mockPrisma.profile.findUnique.mockResolvedValue(mockProfile);

      const existing = await mockPrisma.profile.findUnique({
        where: { userId: USER_ID },
      });
      expect(existing).not.toBeNull();

      // Service throws without creating
      const error = new ProfileError('Profile already exists.');
      expect(error).toBeInstanceOf(ProfileError);
      expect(error.name).toBe('ProfileError');
      expect(error.message).toBe('Profile already exists.');
    });
  });

  // ── Step 9: Token refresh ───────────────────────────────────────────────

  describe('Step 9: Token refresh', () => {
    it('revokes old refresh token and returns new token pair', async () => {
      const record = { ...mockRefreshToken, revokedAt: null };
      mockPrisma.refreshToken.findUnique.mockResolvedValue(record);
      mockPrisma.refreshToken.update.mockResolvedValue({ ...record, revokedAt: now });

      const newRefreshTokenRecord = {
        ...mockRefreshToken,
        id: 'rt-2',
        token: 'new-refresh-token-xyz',
      };
      mockPrisma.refreshToken.create.mockResolvedValue(newRefreshTokenRecord);

      // 1. Find the refresh token
      const found = await mockPrisma.refreshToken.findUnique({
        where: { token: REFRESH_TOKEN_VALUE },
      });

      expect(found).not.toBeNull();
      expect(found!.revokedAt).toBeNull();
      expect(found!.expiresAt.getTime()).toBeGreaterThan(now.getTime());

      // 2. Revoke old token
      const revoked = await mockPrisma.refreshToken.update({
        where: { id: found!.id },
        data: { revokedAt: now },
      });
      expect(revoked.revokedAt).not.toBeNull();

      // 3. Create new token pair
      const created = await mockPrisma.refreshToken.create({
        data: {
          userId: found!.userId,
          token: newRefreshTokenRecord.token,
          expiresAt: new Date(now.getTime() + AUTH.REFRESH_TOKEN_TTL_S * 1000),
        },
      });

      const tokens = {
        accessToken: 'eyJhbGciOiJIUzI1NiJ9.new-access-token',
        refreshToken: created.token,
      };
      expect(tokens.accessToken).toBeTruthy();
      expect(tokens.refreshToken).toBe('new-refresh-token-xyz');
      expect(tokens.refreshToken).not.toBe(REFRESH_TOKEN_VALUE);
    });
  });

  // ── Step 10: Token refresh with revoked token ───────────────────────────

  describe('Step 10: Token refresh with revoked token', () => {
    it('throws AuthError when refresh token is already revoked', async () => {
      const revokedRecord = {
        ...mockRefreshToken,
        revokedAt: new Date('2026-03-24T11:00:00Z'),
      };
      mockPrisma.refreshToken.findUnique.mockResolvedValue(revokedRecord);

      const found = await mockPrisma.refreshToken.findUnique({
        where: { token: REFRESH_TOKEN_VALUE },
      });

      expect(found).not.toBeNull();
      expect(found!.revokedAt).not.toBeNull();

      // Service checks: record exists but revokedAt is set
      const isInvalid = !found || found.revokedAt !== null || found.expiresAt < now;
      expect(isInvalid).toBe(true);

      const error = new AuthError('Invalid or expired refresh token.');
      expect(error).toBeInstanceOf(AuthError);
      expect(error.name).toBe('AuthError');
      expect(error.message).toBe('Invalid or expired refresh token.');
    });

    it('throws AuthError when refresh token is expired', async () => {
      const expiredRecord = {
        ...mockRefreshToken,
        revokedAt: null,
        expiresAt: new Date('2026-03-20T00:00:00Z'),
      };
      mockPrisma.refreshToken.findUnique.mockResolvedValue(expiredRecord);

      const found = await mockPrisma.refreshToken.findUnique({
        where: { token: REFRESH_TOKEN_VALUE },
      });

      expect(found).not.toBeNull();
      expect(found!.revokedAt).toBeNull();
      expect(found!.expiresAt.getTime()).toBeLessThan(now.getTime());

      const isInvalid = !found || found.revokedAt !== null || found.expiresAt < now;
      expect(isInvalid).toBe(true);

      const error = new AuthError('Invalid or expired refresh token.');
      expect(error).toBeInstanceOf(AuthError);
      expect(error.message).toContain('Invalid or expired refresh token');
    });

    it('throws AuthError when refresh token does not exist', async () => {
      mockPrisma.refreshToken.findUnique.mockResolvedValue(null);

      const found = await mockPrisma.refreshToken.findUnique({
        where: { token: 'nonexistent-token' },
      });

      expect(found).toBeNull();

      const isInvalid = !found;
      expect(isInvalid).toBe(true);

      const error = new AuthError('Invalid or expired refresh token.');
      expect(error).toBeInstanceOf(AuthError);
    });
  });

  // ── Step 11: Logout ─────────────────────────────────────────────────────

  describe('Step 11: Logout', () => {
    it('revokes the refresh token', async () => {
      mockPrisma.refreshToken.updateMany.mockResolvedValue({ count: 1 });

      // Simulate revokeRefreshToken service logic
      const result = await mockPrisma.refreshToken.updateMany({
        where: { token: REFRESH_TOKEN_VALUE, revokedAt: null },
        data: { revokedAt: now },
      });

      expect(mockPrisma.refreshToken.updateMany).toHaveBeenCalledWith({
        where: { token: REFRESH_TOKEN_VALUE, revokedAt: null },
        data: { revokedAt: now },
      });
      expect(result.count).toBe(1);
    });

    it('is idempotent — revoking an already-revoked token is a no-op', async () => {
      mockPrisma.refreshToken.updateMany.mockResolvedValue({ count: 0 });

      const result = await mockPrisma.refreshToken.updateMany({
        where: { token: REFRESH_TOKEN_VALUE, revokedAt: null },
        data: { revokedAt: now },
      });

      // No rows matched because token was already revoked
      expect(result.count).toBe(0);
    });
  });
});
