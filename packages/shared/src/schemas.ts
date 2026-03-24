import { z } from 'zod';
import { AUTH, BLE, PROFILE, PAGINATION } from './constants';

// ─── Auth Schemas ────────────────────────────────────────────────────────────

export const OtpRequestSchema = z.object({
  /** Phone number (E.164) or email address */
  target: z.string().min(1),
  method: z.enum(['PHONE', 'EMAIL']),
});

export const OtpVerifySchema = z.object({
  target: z.string().min(1),
  code: z.string().length(AUTH.OTP_LENGTH),
  method: z.enum(['PHONE', 'EMAIL']),
});

export const RefreshTokenSchema = z.object({
  refreshToken: z.string().min(1),
});

// ─── Profile Schemas ─────────────────────────────────────────────────────────

export const CreateProfileSchema = z.object({
  displayName: z.string().min(1).max(PROFILE.MAX_DISPLAY_NAME_LENGTH),
  birthDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Invalid date format',
  }),
  gender: z.enum(['MALE', 'FEMALE', 'NON_BINARY', 'OTHER']),
  genderPreferences: z.array(z.enum(['MALE', 'FEMALE', 'NON_BINARY', 'OTHER'])).min(1),
  bio: z.string().max(PROFILE.MAX_BIO_LENGTH).optional(),
});

export const UpdateProfileSchema = z.object({
  displayName: z.string().min(1).max(PROFILE.MAX_DISPLAY_NAME_LENGTH).optional(),
  gender: z.enum(['MALE', 'FEMALE', 'NON_BINARY', 'OTHER']).optional(),
  genderPreferences: z.array(z.enum(['MALE', 'FEMALE', 'NON_BINARY', 'OTHER'])).min(1).optional(),
  bio: z.string().max(PROFILE.MAX_BIO_LENGTH).nullable().optional(),
});

// ─── Encounter Schemas ───────────────────────────────────────────────────────

export const BleObservationSchema = z.object({
  observedToken: z.string().min(1),
  rssi: z.number().int().max(0),
  timestamp: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Invalid ISO 8601 timestamp',
  }),
});

export const EncounterUploadSchema = z.object({
  sessionId: z.string().uuid(),
  platform: z.string().min(1),
  osVersion: z.string().min(1),
  observations: z.array(BleObservationSchema).min(1).max(BLE.BATCH_SIZE * 100),
});

// ─── Swipe Schemas ───────────────────────────────────────────────────────────

export const SwipeSchema = z.object({
  encounterId: z.string().uuid(),
  targetId: z.string().uuid(),
  direction: z.enum(['LIKE', 'PASS']),
});

// ─── Chat Schemas ────────────────────────────────────────────────────────────

export const SendMessageSchema = z.object({
  content: z.string().min(1).max(2000),
  type: z.enum(['TEXT', 'IMAGE']).default('TEXT'),
});

// ─── Report/Block Schemas ────────────────────────────────────────────────────

export const CreateReportSchema = z.object({
  reportedId: z.string().uuid(),
  reason: z.enum([
    'HARASSMENT',
    'SPAM',
    'FAKE_PROFILE',
    'INAPPROPRIATE_CONTENT',
    'UNDERAGE',
    'OTHER',
  ]),
  description: z.string().max(1000).optional(),
});

export const BlockSchema = z.object({
  blockedId: z.string().uuid(),
});

// ─── Pagination Schema ──────────────────────────────────────────────────────

export const PaginationSchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(PAGINATION.MAX_PAGE_SIZE).default(PAGINATION.DEFAULT_PAGE_SIZE),
});

// ─── Admin Schemas ───────────────────────────────────────────────────────────

export const UpdateReportSchema = z.object({
  status: z.enum(['PENDING', 'REVIEWING', 'RESOLVED', 'DISMISSED']).optional(),
  resolution: z.string().max(1000).optional(),
});

export const CreateEventSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  venueName: z.string().min(1).max(200),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  startsAt: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Invalid date format',
  }),
  endsAt: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Invalid date format',
  }),
  maxParticipants: z.number().int().positive().optional(),
});

export const UpdateEventSchema = CreateEventSchema.partial();
