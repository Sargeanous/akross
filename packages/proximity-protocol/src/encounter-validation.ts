import { BLE, ENCOUNTER_QUALITY, computeAverageRssi, isWithinWindow } from '@proximity/shared';
import type { BleObservation } from '@proximity/shared';
import type { EncounterValidationInput, EncounterValidationResult } from './types.js';

/**
 * Core encounter validation algorithm.
 *
 * Given BLE observations from two users and their backend-issued tokens, determines
 * whether a valid mutual encounter occurred. This is the most critical piece of business
 * logic in the system — it prevents spoofing and ensures encounters are real.
 *
 * Validation steps:
 * 1. Filter user A's observations to only those matching user B's valid tokens
 * 2. Filter user B's observations to only those matching user A's valid tokens
 * 3. Check that observations from both sides fall within the mutual encounter window
 * 4. Check that RSSI readings meet the minimum threshold
 * 5. Check that the total observation duration meets the minimum
 * 6. Determine quality tier based on average RSSI and duration
 */
export function validateEncounter(input: EncounterValidationInput): EncounterValidationResult {
  const { userATokens, userBTokens, userAObservations, userBObservations } = input;

  // Build lookup sets of valid tokens for each user
  const userATokenSet = new Set(userATokens.map((t) => t.token));
  const userBTokenSet = new Set(userBTokens.map((t) => t.token));

  // Build a map from token -> validity window for timestamp checks
  const userATokenWindows = new Map(
    userATokens.map((t) => [t.token, { issuedAt: t.issuedAt, expiresAt: t.expiresAt }]),
  );
  const userBTokenWindows = new Map(
    userBTokens.map((t) => [t.token, { issuedAt: t.issuedAt, expiresAt: t.expiresAt }]),
  );

  // Step 1: User A observed user B's tokens (A scanned, found B's advertised token)
  const aObservedB = filterValidObservations(userAObservations, userBTokenSet, userBTokenWindows);

  // Step 2: User B observed user A's tokens (B scanned, found A's advertised token)
  const bObservedA = filterValidObservations(userBObservations, userATokenSet, userATokenWindows);

  // Step 3: Check mutual observation — both sides must have seen each other
  if (aObservedB.length === 0 || bObservedA.length === 0) {
    return reject('No mutual observation: one or both sides have no valid observations');
  }

  // Step 4: Check that observations from both sides overlap within the encounter window
  const aTimestamps = aObservedB.map((o) => new Date(o.timestamp));
  const bTimestamps = bObservedA.map((o) => new Date(o.timestamp));

  const earliestA = new Date(Math.min(...aTimestamps.map((t) => t.getTime())));
  const latestA = new Date(Math.max(...aTimestamps.map((t) => t.getTime())));
  const earliestB = new Date(Math.min(...bTimestamps.map((t) => t.getTime())));
  const latestB = new Date(Math.max(...bTimestamps.map((t) => t.getTime())));

  // At least one observation from each side must be within the mutual window
  const hasMutualWindow = aTimestamps.some((aTime) =>
    bTimestamps.some((bTime) => isWithinWindow(aTime, bTime, BLE.MUTUAL_ENCOUNTER_WINDOW_S)),
  );

  if (!hasMutualWindow) {
    return reject('Observations do not overlap within the mutual encounter window');
  }

  // Step 5: Check RSSI quality — filter out observations below minimum threshold
  const allRssiValues = [...aObservedB.map((o) => o.rssi), ...bObservedA.map((o) => o.rssi)];
  const validRssiValues = allRssiValues.filter((rssi) => rssi >= BLE.MIN_RSSI);

  if (validRssiValues.length === 0) {
    return reject(`All RSSI readings below minimum threshold (${BLE.MIN_RSSI} dBm)`);
  }

  const averageRssi = computeAverageRssi(validRssiValues);

  if (averageRssi < BLE.MIN_RSSI) {
    return reject(`Average RSSI ${averageRssi.toFixed(1)} dBm below minimum ${BLE.MIN_RSSI} dBm`);
  }

  // Step 6: Check duration — the encounter must span at least MIN_DURATION_S
  const overallEarliest = new Date(Math.min(earliestA.getTime(), earliestB.getTime()));
  const overallLatest = new Date(Math.max(latestA.getTime(), latestB.getTime()));
  const durationSeconds = (overallLatest.getTime() - overallEarliest.getTime()) / 1000;

  if (durationSeconds < BLE.MIN_DURATION_S) {
    return reject(
      `Encounter duration ${durationSeconds.toFixed(0)}s below minimum ${BLE.MIN_DURATION_S}s`,
    );
  }

  // Step 7: Determine quality tier
  const quality = determineQuality(averageRssi, durationSeconds);

  // Round the encounter time to nearest minute for privacy
  const midpoint = new Date((overallEarliest.getTime() + overallLatest.getTime()) / 2);
  const occurredAt = roundToNearestMinute(midpoint);

  return {
    isValid: true,
    quality,
    averageRssi: Math.round(averageRssi * 10) / 10,
    durationSeconds: Math.round(durationSeconds),
    occurredAt,
    rejectionReason: null,
  };
}

/**
 * Filter observations to only those that match known valid tokens,
 * and where the observation timestamp falls within the token's validity window.
 */
function filterValidObservations(
  observations: BleObservation[],
  validTokenSet: Set<string>,
  tokenWindows: Map<string, { issuedAt: Date; expiresAt: Date }>,
): BleObservation[] {
  return observations.filter((obs) => {
    if (!validTokenSet.has(obs.observedToken)) return false;

    const window = tokenWindows.get(obs.observedToken);
    if (!window) return false;

    const obsTime = new Date(obs.timestamp);
    // Allow a small grace period (token TTL) beyond the expiry to account for clock drift
    const graceMs = BLE.TOKEN_TTL_S * 1000;
    return (
      obsTime.getTime() >= window.issuedAt.getTime() - graceMs &&
      obsTime.getTime() <= window.expiresAt.getTime() + graceMs
    );
  });
}

function determineQuality(avgRssi: number, durationS: number): 'HIGH' | 'MEDIUM' | 'LOW' {
  if (
    avgRssi >= ENCOUNTER_QUALITY.HIGH.minAvgRssi &&
    durationS >= ENCOUNTER_QUALITY.HIGH.minDurationS
  ) {
    return 'HIGH';
  }
  if (
    avgRssi >= ENCOUNTER_QUALITY.MEDIUM.minAvgRssi &&
    durationS >= ENCOUNTER_QUALITY.MEDIUM.minDurationS
  ) {
    return 'MEDIUM';
  }
  return 'LOW';
}

function roundToNearestMinute(date: Date): Date {
  const ms = date.getTime();
  return new Date(Math.round(ms / 60000) * 60000);
}

function reject(reason: string): EncounterValidationResult {
  return {
    isValid: false,
    quality: null,
    averageRssi: null,
    durationSeconds: null,
    occurredAt: null,
    rejectionReason: reason,
  };
}
