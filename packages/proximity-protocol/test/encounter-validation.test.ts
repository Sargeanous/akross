import { describe, it, expect } from 'vitest';
import { validateEncounter } from '../src/encounter-validation.js';
import type { EncounterValidationInput } from '../src/types.js';
import type { BleObservation } from '@proximity/shared';

function makeToken(token: string, minutesAgo: number) {
  const issuedAt = new Date(Date.now() - minutesAgo * 60 * 1000);
  const expiresAt = new Date(issuedAt.getTime() + 30 * 1000); // 30s TTL
  return { token, issuedAt, expiresAt };
}

function makeObservation(token: string, rssi: number, minutesAgo: number): BleObservation {
  return {
    observedToken: token,
    rssi,
    timestamp: new Date(Date.now() - minutesAgo * 60 * 1000).toISOString(),
  };
}

describe('validateEncounter', () => {
  it('validates a HIGH quality mutual encounter', () => {
    const input: EncounterValidationInput = {
      userAId: 'user-a',
      userBId: 'user-b',
      userATokens: [makeToken('token-a1', 3), makeToken('token-a2', 2)],
      userBTokens: [makeToken('token-b1', 3), makeToken('token-b2', 2)],
      // User A observed user B's tokens
      userAObservations: [
        makeObservation('token-b1', -45, 3),
        makeObservation('token-b1', -48, 2.8),
        makeObservation('token-b2', -50, 2),
        makeObservation('token-b2', -47, 1.5),
      ],
      // User B observed user A's tokens
      userBObservations: [
        makeObservation('token-a1', -46, 3),
        makeObservation('token-a1', -44, 2.5),
        makeObservation('token-a2', -49, 2),
        makeObservation('token-a2', -51, 1.5),
      ],
    };

    const result = validateEncounter(input);

    expect(result.isValid).toBe(true);
    expect(result.quality).toBe('HIGH');
    expect(result.averageRssi).not.toBeNull();
    expect(result.averageRssi!).toBeGreaterThan(-55);
    expect(result.durationSeconds).not.toBeNull();
    expect(result.durationSeconds!).toBeGreaterThanOrEqual(60);
    expect(result.occurredAt).toBeInstanceOf(Date);
    expect(result.rejectionReason).toBeNull();
  });

  it('validates a MEDIUM quality encounter', () => {
    const input: EncounterValidationInput = {
      userAId: 'user-a',
      userBId: 'user-b',
      userATokens: [makeToken('token-a1', 2)],
      userBTokens: [makeToken('token-b1', 2)],
      userAObservations: [
        makeObservation('token-b1', -60, 2),
        makeObservation('token-b1', -62, 1.5),
      ],
      userBObservations: [
        makeObservation('token-a1', -58, 2),
        makeObservation('token-a1', -61, 1.5),
      ],
    };

    const result = validateEncounter(input);

    expect(result.isValid).toBe(true);
    expect(result.quality).toBe('MEDIUM');
  });

  it('validates a LOW quality encounter', () => {
    const input: EncounterValidationInput = {
      userAId: 'user-a',
      userBId: 'user-b',
      userATokens: [makeToken('token-a1', 1)],
      userBTokens: [makeToken('token-b1', 1)],
      userAObservations: [
        makeObservation('token-b1', -70, 1),
        makeObservation('token-b1', -72, 0.8),
      ],
      userBObservations: [
        makeObservation('token-a1', -68, 1),
        makeObservation('token-a1', -71, 0.8),
      ],
    };

    const result = validateEncounter(input);

    expect(result.isValid).toBe(true);
    expect(result.quality).toBe('LOW');
  });

  it('rejects when only one side has observations', () => {
    const input: EncounterValidationInput = {
      userAId: 'user-a',
      userBId: 'user-b',
      userATokens: [makeToken('token-a1', 2)],
      userBTokens: [makeToken('token-b1', 2)],
      userAObservations: [makeObservation('token-b1', -50, 2)],
      userBObservations: [], // User B saw nothing
    };

    const result = validateEncounter(input);

    expect(result.isValid).toBe(false);
    expect(result.rejectionReason).toContain('No mutual observation');
  });

  it('rejects when tokens do not match', () => {
    const input: EncounterValidationInput = {
      userAId: 'user-a',
      userBId: 'user-b',
      userATokens: [makeToken('token-a1', 2)],
      userBTokens: [makeToken('token-b1', 2)],
      // User A observed a token that was never issued to user B
      userAObservations: [makeObservation('fake-token', -50, 2)],
      userBObservations: [makeObservation('token-a1', -50, 2)],
    };

    const result = validateEncounter(input);

    expect(result.isValid).toBe(false);
    expect(result.rejectionReason).toContain('No mutual observation');
  });

  it('rejects when RSSI is too weak', () => {
    const input: EncounterValidationInput = {
      userAId: 'user-a',
      userBId: 'user-b',
      userATokens: [makeToken('token-a1', 1)],
      userBTokens: [makeToken('token-b1', 1)],
      userAObservations: [
        makeObservation('token-b1', -90, 1),
        makeObservation('token-b1', -92, 0.8),
      ],
      userBObservations: [
        makeObservation('token-a1', -88, 1),
        makeObservation('token-a1', -91, 0.8),
      ],
    };

    const result = validateEncounter(input);

    expect(result.isValid).toBe(false);
    expect(result.rejectionReason).toContain('RSSI');
  });

  it('rejects when duration is too short', () => {
    const now = Date.now();
    const input: EncounterValidationInput = {
      userAId: 'user-a',
      userBId: 'user-b',
      userATokens: [
        {
          token: 'token-a1',
          issuedAt: new Date(now - 5000),
          expiresAt: new Date(now + 25000),
        },
      ],
      userBTokens: [
        {
          token: 'token-b1',
          issuedAt: new Date(now - 5000),
          expiresAt: new Date(now + 25000),
        },
      ],
      // Observations within 2 seconds of each other — below the 10s minimum
      userAObservations: [
        {
          observedToken: 'token-b1',
          rssi: -50,
          timestamp: new Date(now - 2000).toISOString(),
        },
        {
          observedToken: 'token-b1',
          rssi: -51,
          timestamp: new Date(now - 1000).toISOString(),
        },
      ],
      userBObservations: [
        {
          observedToken: 'token-a1',
          rssi: -50,
          timestamp: new Date(now - 2000).toISOString(),
        },
        {
          observedToken: 'token-a1',
          rssi: -52,
          timestamp: new Date(now - 1000).toISOString(),
        },
      ],
    };

    const result = validateEncounter(input);

    expect(result.isValid).toBe(false);
    expect(result.rejectionReason).toContain('duration');
  });

  it('rejects when observations are outside the mutual window', () => {
    const input: EncounterValidationInput = {
      userAId: 'user-a',
      userBId: 'user-b',
      userATokens: [makeToken('token-a1', 60)],
      userBTokens: [makeToken('token-b1', 2)],
      // User A observed 60 minutes ago, User B observed 2 minutes ago — too far apart
      userAObservations: [
        makeObservation('token-b1', -50, 60),
        makeObservation('token-b1', -50, 59.5),
      ],
      userBObservations: [
        makeObservation('token-a1', -50, 2),
        makeObservation('token-a1', -50, 1.5),
      ],
    };

    const result = validateEncounter(input);

    expect(result.isValid).toBe(false);
  });

  it('rounds occurredAt to nearest minute for privacy', () => {
    const input: EncounterValidationInput = {
      userAId: 'user-a',
      userBId: 'user-b',
      userATokens: [makeToken('token-a1', 3), makeToken('token-a2', 2)],
      userBTokens: [makeToken('token-b1', 3), makeToken('token-b2', 2)],
      userAObservations: [
        makeObservation('token-b1', -50, 3),
        makeObservation('token-b2', -50, 2),
      ],
      userBObservations: [
        makeObservation('token-a1', -50, 3),
        makeObservation('token-a2', -50, 2),
      ],
    };

    const result = validateEncounter(input);

    expect(result.isValid).toBe(true);
    expect(result.occurredAt).toBeInstanceOf(Date);
    // Check that seconds are 0 (rounded to minute)
    expect(result.occurredAt!.getSeconds()).toBe(0);
    expect(result.occurredAt!.getMilliseconds()).toBe(0);
  });
});
