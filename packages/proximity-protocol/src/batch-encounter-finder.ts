import type { BleObservation } from '@proximity/shared';
import type { EncounterValidationInput, EncounterValidationResult } from './types.js';
import { validateEncounter } from './encounter-validation.js';

interface SessionParticipant {
  userId: string;
  sessionId: string;
  tokens: Array<{ token: string; issuedAt: Date; expiresAt: Date }>;
  observations: BleObservation[];
}

export interface MutualEncounterResult {
  userAId: string;
  userBId: string;
  sessionAId: string;
  sessionBId: string;
  validation: EncounterValidationResult;
}

/**
 * Given all participants in a proximity session, find every mutual encounter pair.
 * Iterates over all unique pairs of participants and runs the encounter validation
 * algorithm on each. Only returns pairs where validation succeeds.
 *
 * This runs as a background job after observations are uploaded.
 * For N participants, this evaluates N*(N-1)/2 pairs.
 */
export function findMutualEncounters(
  participants: SessionParticipant[],
): MutualEncounterResult[] {
  const results: MutualEncounterResult[] = [];

  for (let i = 0; i < participants.length; i++) {
    for (let j = i + 1; j < participants.length; j++) {
      const a = participants[i];
      const b = participants[j];

      const input: EncounterValidationInput = {
        userAId: a.userId,
        userBId: b.userId,
        userATokens: a.tokens,
        userBTokens: b.tokens,
        userAObservations: a.observations,
        userBObservations: b.observations,
      };

      const validation = validateEncounter(input);

      if (validation.isValid) {
        results.push({
          userAId: a.userId,
          userBId: b.userId,
          sessionAId: a.sessionId,
          sessionBId: b.sessionId,
          validation,
        });
      }
    }
  }

  return results;
}
