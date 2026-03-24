import { Worker, Queue } from 'bullmq';
import { getRedisUrl } from '../config/redis.js';

export const notificationQueue = new Queue('notification', {
  connection: { url: getRedisUrl() },
});

/**
 * Notification worker (stubbed for MVP).
 *
 * In production, this will integrate with APNs (iOS) and FCM (Android)
 * to send push notifications for:
 * - New matches
 * - New messages
 * - Event starting soon
 *
 * For now, it just logs the notification to console.
 */
export function createNotificationWorker() {
  return new Worker(
    'notification',
    async (job) => {
      const { type, ...data } = job.data as {
        type: 'match' | 'message' | 'event_reminder';
        [key: string]: any;
      };

      // Stub: log notification
      console.log(`[PUSH-NOTIFICATION] type=${type}`, data);

      // In production:
      // 1. Look up device tokens for target userIds
      // 2. Format the notification payload
      // 3. Send via APNs/FCM
      // 4. Handle delivery failures and token invalidation

      return { sent: false, reason: 'Push provider not configured (stub)' };
    },
    { connection: { url: getRedisUrl() } },
  );
}
