// ─── Enums ───────────────────────────────────────────────────────────────────

export type AuthMethod = 'PHONE' | 'EMAIL';
export type Gender = 'MALE' | 'FEMALE' | 'NON_BINARY' | 'OTHER';
export type EventStatus = 'DRAFT' | 'ACTIVE' | 'ENDED' | 'CANCELLED';
export type EncounterQuality = 'HIGH' | 'MEDIUM' | 'LOW';
export type SwipeDirection = 'LIKE' | 'PASS';
export type MessageType = 'TEXT' | 'IMAGE' | 'SYSTEM';
export type ReportReason = 'HARASSMENT' | 'SPAM' | 'FAKE_PROFILE' | 'INAPPROPRIATE_CONTENT' | 'UNDERAGE' | 'OTHER';
export type ReportStatus = 'PENDING' | 'REVIEWING' | 'RESOLVED' | 'DISMISSED';
export type SubscriptionTier = 'FREE' | 'PLUS' | 'PREMIUM';
export type SubscriptionProvider = 'APPLE' | 'GOOGLE' | 'STRIPE';

// ─── Core Entities ───────────────────────────────────────────────────────────

export interface User {
  id: string;
  phone: string | null;
  email: string | null;
  authMethod: AuthMethod;
  isVerified: boolean;
  isBanned: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Profile {
  id: string;
  userId: string;
  displayName: string;
  birthDate: Date;
  gender: Gender;
  genderPreferences: Gender[];
  bio: string | null;
  isComplete: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProfilePhoto {
  id: string;
  profileId: string;
  url: string;
  position: number;
  isVerified: boolean;
  createdAt: Date;
}

// ─── Proximity / BLE ─────────────────────────────────────────────────────────

export interface ProximityEvent {
  id: string;
  name: string;
  description: string | null;
  venueName: string;
  latitude: number;
  longitude: number;
  startsAt: Date;
  endsAt: Date;
  status: EventStatus;
  maxParticipants: number | null;
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProximitySession {
  id: string;
  userId: string;
  eventId: string;
  startedAt: Date;
  endedAt: Date | null;
  isActive: boolean;
}

export interface ProximityToken {
  id: string;
  token: string;
  userId: string;
  sessionId: string;
  issuedAt: Date;
  expiresAt: Date;
}

/** A single BLE observation from the scanner device */
export interface BleObservation {
  /** The BLE token that was observed (advertised by the other device) */
  observedToken: string;
  /** RSSI signal strength in dBm */
  rssi: number;
  /** Timestamp of the observation (device clock, ISO 8601) */
  timestamp: string;
}

export interface EncounterUpload {
  sessionId: string;
  platform: string;
  osVersion: string;
  observations: BleObservation[];
}

export interface Encounter {
  id: string;
  userAId: string;
  userBId: string;
  eventId: string;
  sessionAId: string;
  sessionBId: string;
  quality: EncounterQuality;
  /** Rounded to nearest minute for privacy */
  occurredAt: Date;
  createdAt: Date;
}

// ─── Social ──────────────────────────────────────────────────────────────────

export interface Swipe {
  id: string;
  swiperId: string;
  targetId: string;
  encounterId: string;
  direction: SwipeDirection;
  createdAt: Date;
}

export interface Match {
  id: string;
  userAId: string;
  userBId: string;
  encounterId: string;
  swipeAId: string;
  swipeBId: string;
  isActive: boolean;
  createdAt: Date;
}

export interface ChatThread {
  id: string;
  matchId: string;
  userAId: string;
  userBId: string;
  lastMessageAt: Date | null;
  isActive: boolean;
  createdAt: Date;
}

export interface Message {
  id: string;
  threadId: string;
  senderId: string;
  type: MessageType;
  content: string;
  readAt: Date | null;
  createdAt: Date;
}

// ─── Moderation ──────────────────────────────────────────────────────────────

export interface Report {
  id: string;
  reporterId: string;
  reportedId: string;
  reason: ReportReason;
  description: string | null;
  status: ReportStatus;
  moderatorId: string | null;
  resolution: string | null;
  resolvedAt: Date | null;
  createdAt: Date;
}

export interface Block {
  id: string;
  blockerId: string;
  blockedId: string;
  createdAt: Date;
}

// ─── Subscription ────────────────────────────────────────────────────────────

export interface Subscription {
  id: string;
  userId: string;
  tier: SubscriptionTier;
  startsAt: Date;
  expiresAt: Date;
  isActive: boolean;
  provider: SubscriptionProvider;
  externalId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// ─── API DTOs ────────────────────────────────────────────────────────────────

export interface AuthTokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  cursor: string | null;
  hasMore: boolean;
}

export interface ChatThreadWithMeta extends ChatThread {
  unreadCount: number;
  lastMessage: Message | null;
}
