import { getPrisma } from '../../config/prisma.js';
import { issueTokenBatch } from '../event/service.js';
import type { BleObservation } from '@proximity/shared';

const prisma = getPrisma();

/**
 * Request a new batch of BLE tokens for the user's active session.
 * Called when the client is running low on tokens.
 */
export async function requestTokens(userId: string, sessionId: string) {
  const session = await prisma.proximitySession.findFirst({
    where: { id: sessionId, userId, isActive: true },
  });

  if (!session) {
    throw new EncounterError('No active session found.');
  }

  return issueTokenBatch(userId, session.id);
}

/**
 * Upload BLE observations from the device.
 * Stores raw observations for later async processing by the encounter-validation job.
 */
export async function uploadObservations(
  userId: string,
  data: {
    sessionId: string;
    platform: string;
    osVersion: string;
    observations: BleObservation[];
  },
) {
  const session = await prisma.proximitySession.findFirst({
    where: { id: data.sessionId, userId },
  });

  if (!session) {
    throw new EncounterError('Session not found or does not belong to you.');
  }

  const upload = await prisma.observationUpload.create({
    data: {
      sessionId: data.sessionId,
      platform: data.platform,
      osVersion: data.osVersion,
      observations: data.observations as any, // Prisma Json type
    },
  });

  // The encounter-validation background job will pick this up via the processedAt = null filter
  return { uploadId: upload.id, observationCount: data.observations.length };
}

/**
 * List verified encounters for the current user.
 * These are the candidates the user can swipe on.
 * Only returns encounters that haven't already been swiped on and aren't blocked.
 */
export async function listEncounters(userId: string) {
  // Get blocked user IDs (both directions)
  const blocks = await prisma.block.findMany({
    where: {
      OR: [{ blockerId: userId }, { blockedId: userId }],
    },
  });
  const blockedIds = new Set(blocks.map((b) => b.blockerId === userId ? b.blockedId : b.blockerId));

  // Get already-swiped encounter IDs
  const existingSwipes = await prisma.swipe.findMany({
    where: { swiperId: userId },
    select: { encounterId: true },
  });
  const swipedEncounterIds = new Set(existingSwipes.map((s) => s.encounterId));

  // Get encounters involving this user
  const encounters = await prisma.encounter.findMany({
    where: {
      OR: [{ userAId: userId }, { userBId: userId }],
    },
    include: {
      event: { select: { name: true, venueName: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  // Filter out blocked users and already-swiped encounters
  return encounters
    .filter((e) => !swipedEncounterIds.has(e.id))
    .filter((e) => {
      const otherId = e.userAId === userId ? e.userBId : e.userAId;
      return !blockedIds.has(otherId);
    })
    .map((e) => ({
      id: e.id,
      otherUserId: e.userAId === userId ? e.userBId : e.userAId,
      quality: e.quality,
      eventName: e.event.name,
      venueName: e.event.venueName,
      // Only expose rounded time — never exact timestamps
      occurredAt: e.occurredAt,
    }));
}

export class EncounterError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'EncounterError';
  }
}
