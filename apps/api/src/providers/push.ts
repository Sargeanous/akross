import { getEnv } from '../config/env.js';
import { getPrisma } from '../config/prisma.js';

// ─── Provider Interface ──────────────────────────────────────────────────────

export interface PushNotification {
  title: string;
  body: string;
  data?: Record<string, string>;
}

export interface PushProvider {
  send(userIds: string[], notification: PushNotification): Promise<{ sent: number; failed: number }>;
}

// ─── Console Provider (development) ──────────────────────────────────────────

class ConsolePushProvider implements PushProvider {
  async send(userIds: string[], notification: PushNotification) {
    console.log(`[PUSH] Would send to ${userIds.length} user(s):`);
    console.log(`  Title: ${notification.title}`);
    console.log(`  Body: ${notification.body}`);
    if (notification.data) console.log(`  Data:`, notification.data);
    return { sent: 0, failed: 0 };
  }
}

// ─── APNs + FCM Provider (production) ────────────────────────────────────────
// Uncomment when ready. Requires:
// - DeviceToken model in Prisma (userId, platform, token, createdAt)
// - APNs key/cert for iOS
// - FCM server key or service account for Android
//
// class FirebasePushProvider implements PushProvider {
//   async send(userIds: string[], notification: PushNotification) {
//     const prisma = getPrisma();
//     const tokens = await prisma.deviceToken.findMany({
//       where: { userId: { in: userIds } },
//     });
//
//     let sent = 0, failed = 0;
//     for (const token of tokens) {
//       try {
//         // Use firebase-admin SDK to send
//         // await admin.messaging().send({ token: token.token, notification, data });
//         sent++;
//       } catch {
//         failed++;
//       }
//     }
//     return { sent, failed };
//   }
// }

// ─── Factory ─────────────────────────────────────────────────────────────────

let _provider: PushProvider | null = null;

export function getPushProvider(): PushProvider {
  if (_provider) return _provider;

  const env = getEnv();
  switch (env.PUSH_PROVIDER) {
    // case 'firebase':
    //   _provider = new FirebasePushProvider();
    //   break;
    case 'console':
    default:
      _provider = new ConsolePushProvider();
  }
  return _provider;
}
