import { Worker, Queue } from 'bullmq';
import { getPrisma } from '../config/prisma.js';
import { getRedis } from '../config/redis.js';

export const sessionCleanupQueue = new Queue('session-cleanup', {
  connection: getRedis(),
});

/**
 * Session cleanup worker.
 * Runs periodically to:
 * 1. End sessions for events that have ended
 * 2. Expire old BLE tokens that are past their TTL
 */
export function createSessionCleanupWorker() {
  return new Worker(
    'session-cleanup',
    async () => {
      const prisma = getPrisma();
      const now = new Date();

      // End sessions for events that have ended
      const endedEvents = await prisma.proximityEvent.findMany({
        where: { endsAt: { lt: now }, status: 'ACTIVE' },
        select: { id: true },
      });

      if (endedEvents.length > 0) {
        const eventIds = endedEvents.map((e) => e.id);

        await prisma.proximitySession.updateMany({
          where: { eventId: { in: eventIds }, isActive: true },
          data: { isActive: false, endedAt: now },
        });

        // Mark events as ended
        await prisma.proximityEvent.updateMany({
          where: { id: { in: eventIds } },
          data: { status: 'ENDED' },
        });
      }

      // Clean up expired tokens older than 24 hours (keep recent for validation)
      const cutoff = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      await prisma.proximityTokenRecord.deleteMany({
        where: { expiresAt: { lt: cutoff } },
      });

      return { endedEvents: endedEvents.length };
    },
    { connection: getRedis() },
  );
}

/**
 * Schedule the cleanup job to run every 5 minutes.
 */
export async function scheduleSessionCleanup() {
  await sessionCleanupQueue.upsertJobScheduler(
    'session-cleanup-scheduler',
    { every: 5 * 60 * 1000 },
    { name: 'cleanup' },
  );
}
