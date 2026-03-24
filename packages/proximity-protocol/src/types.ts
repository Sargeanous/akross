import type { EncounterQuality, BleObservation } from '@proximity/shared';

// ─── BLE Hardware Abstractions ───────────────────────────────────────────────
// These interfaces are implemented by platform-specific code (React Native modules).

export type BluetoothState = 'unknown' | 'resetting' | 'unsupported' | 'unauthorized' | 'poweredOff' | 'poweredOn';

export interface PermissionResult {
  granted: boolean;
  canAskAgain: boolean;
}

export interface RawBleDiscovery {
  /** The raw BLE peripheral identifier */
  peripheralId: string;
  /** Service UUIDs advertised */
  serviceUUIDs: string[];
  /** The token value read from the characteristic */
  token: string;
  /** RSSI at time of discovery */
  rssi: number;
  /** Device timestamp (ms since epoch) */
  timestampMs: number;
}

export interface BleScanner {
  start(): Promise<void>;
  stop(): Promise<void>;
  onDiscovery(callback: (discovery: RawBleDiscovery) => void): () => void;
  getState(): Promise<BluetoothState>;
}

export interface BleAdvertiser {
  start(token: string): Promise<void>;
  stop(): Promise<void>;
  updateToken(token: string): Promise<void>;
  getState(): Promise<BluetoothState>;
}

// ─── Session Management ──────────────────────────────────────────────────────

export interface ProximitySessionManager {
  /** Start a proximity session for an event, begin scanning + advertising */
  startSession(eventId: string, tokens: string[]): Promise<void>;
  /** Stop the current session and upload remaining observations */
  stopSession(): Promise<void>;
  /** Whether a session is currently active */
  isActive(): boolean;
  /** Get accumulated observations for upload */
  getObservations(): BleObservation[];
  /** Clear observations after successful upload */
  clearObservations(): void;
}

export interface TokenRotationManager {
  /** Load a batch of tokens and begin rotation */
  start(tokens: string[], rotationIntervalMs: number): void;
  /** Stop rotating */
  stop(): void;
  /** Get the current active token */
  getCurrentToken(): string | null;
  /** How many unused tokens remain */
  remainingTokens(): number;
  /** Set callback for when tokens are running low */
  onTokensLow(callback: (remaining: number) => void): void;
}

// ─── Encounter Validation (Backend) ──────────────────────────────────────────

/** Input to the encounter validation algorithm for a single pair of users */
export interface EncounterValidationInput {
  userAId: string;
  userBId: string;
  /** Tokens that were issued to user A during this session */
  userATokens: Array<{ token: string; issuedAt: Date; expiresAt: Date }>;
  /** Tokens that were issued to user B during this session */
  userBTokens: Array<{ token: string; issuedAt: Date; expiresAt: Date }>;
  /** Observations uploaded by user A */
  userAObservations: BleObservation[];
  /** Observations uploaded by user B */
  userBObservations: BleObservation[];
}

export interface EncounterValidationResult {
  /** Whether a valid mutual encounter was detected */
  isValid: boolean;
  /** Quality tier if valid */
  quality: EncounterQuality | null;
  /** Average RSSI across all mutual observations */
  averageRssi: number | null;
  /** Total duration of mutual observations in seconds */
  durationSeconds: number | null;
  /** The approximate time the encounter occurred (rounded to nearest minute) */
  occurredAt: Date | null;
  /** Rejection reason if invalid */
  rejectionReason: string | null;
}
