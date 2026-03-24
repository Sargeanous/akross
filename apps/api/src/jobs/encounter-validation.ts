import { Worker, Queue } from 'bullmq';
import { getPrisma } from '../config/prisma.js';
import { getRedis } from '../config/redis.js';
import { findMutualEncounters } from '@proximity/protocol';
import type { BleObservation } from '@proximity/shared';

export const encounterValidationQueue = new Queue('encounter-validation', {
  connection: getRedis(),
});

/**
 * Encounter validation worker.
 *
 * After a user uploads BLE observations, this job:
 * 1. Fetches all unprocessed observation uploads for the same event
 * 2. Resolves each participant's tokens and observations
 * 3. Runs the mutual encounter finder (the core algorithm from @proximity/protocol)
 * 4. Creates Encounter records for any new validated pairs
 *
 * This is the most important background job — it's where BLE observations
 * become verified encounters that users can swipe on.
 */
export function createEncounterValidationWorker() {
  return new Worker(
    'encounter-validation',
    async (job) => {
      const { uploadId } = job.data as { uploadId: string };
      const prisma = getPrisma();

      // Fetch the upload and its session
      const upload = await prisma.observationUpload.findUnique({
        where: { id: uploadId },
        include: { session: true },
      });

      if (!upload || upload.processedAt) return;

      const eventId = upload.session.eventId;

      // Get all sessions for this event (all participants)
      const sessions = await prisma.proximitySession.findMany({
        where: { eventId },
        include: {
          tokens: true,
          observationUploads: {
            where: { processedAt: null },
          },
        },
      });

      // Build participant data for the batch encounter finder
      const participants = sessions.map((session) => ({
        userId: session.userId,
        sessionId: session.id,
        tokens: session.tokens.map((t) => ({
          token: t.token,
          issuedAt: t.issuedAt,
          expiresAt: t.expiresAt,
        })),
        observations: session.observationUploads.flatMap(
          (u) => u.observations as unknown as BleObservation[],
        ),
      }));

      // Run the encounter validation algorithm
      const encounters = findMutualEncounters(participants);

      // Create encounter records (skip duplicates via unique constraint)
      for (const result of encounters) {
        // Consistent ordering: lower userId = userA
        const [userAId, userBId] = [result.userAId, result.userBId].sort();
        const [sessionAId, sessionBId] =
          userAId === result.userAId
            ? [result.sessionAId, result.sessionBId]
            : [result.sessionBId, result.sessionAId];

        try {
          await prisma.encounter.create({
            data: {
              userAId,
              userBId,
              eventId,
              sessionAId,
              sessionBId,
              quality: result.validation.quality!,
              occurredAt: result.validation.occurredAt!,
            },
          });
        } catch (err: any) {
          // Unique constraint violation means encounter already exists — skip
          if (err?.code === 'P2002') continue;
          throw err;
        }
      }

      // Mark all uploads for this event as processed
      const uploadIds = sessions.flatMap((s) =>
        s.observationUploads.map((u) => u.id),
      );
      if (uploadIds.length > 0) {
        await prisma.observationUpload.updateMany({
          where: { id: { in: uploadIds } },
          data: { processedAt: new Date() },
        });
      }

      return { processedEncounters: encounters.length };
    },
    { connection: getRedis() },
  );
}
