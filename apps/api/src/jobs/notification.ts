import { Worker, Queue } from 'bullmq';
import { getRedisUrl } from '../config/redis.js';
import { getPushProvider, type PushNotification } from '../providers/push.js';

export const notificationQueue = new Queue('notification', {
  connection: { url: getRedisUrl() },
});

const NOTIFICATION_TEMPLATES: Record<string, (data: any) => PushNotification> = {
  match: () => ({
    title: "It's a Match!",
    body: "Someone you met nearby liked you back. Start chatting!",
    data: { screen: 'matches' },
  }),
  message: (data) => ({
    title: 'New Message',
    body: data.preview ?? 'You have a new message',
    data: { screen: 'chat', threadId: data.threadId },
  }),
  event_reminder: (data) => ({
    title: 'Event Starting Soon',
    body: `${data.eventName} starts in ${data.minutesUntil} minutes`,
    data: { screen: 'nearby', eventId: data.eventId },
  }),
};

/**
 * Notification worker.
 *
 * Routes notifications through the configured push provider (console/Firebase).
 * Each notification type has a template that generates the title/body/data.
 */
export function createNotificationWorker() {
  return new Worker(
    'notification',
    async (job) => {
      const { type, userIds, ...data } = job.data as {
        type: string;
        userIds: string[];
        [key: string]: any;
      };

      const template = NOTIFICATION_TEMPLATES[type];
      if (!template) {
        return { sent: 0, failed: 0, reason: `Unknown notification type: ${type}` };
      }

      const notification = template(data);
      const provider = getPushProvider();
      const result = await provider.send(userIds ?? [], notification);

      return result;
    },
    { connection: { url: getRedisUrl() } },
  );
}
