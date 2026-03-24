import { getPrisma } from '../../config/prisma.js';
import { getRedis } from '../../config/redis.js';

const prisma = getPrisma();

/**
 * Submit a swipe on an encounter-eligible profile.
 *
 * Key invariants:
 * - The encounterId must reference a real verified encounter involving the swiper
 * - Only one swipe per swiper per encounter (enforced at DB level too)
 * - On mutual LIKE: create Match, create ChatThread, and notify both users
 */
export async function submitSwipe(
  swiperId: string,
  data: { encounterId: string; targetId: string; direction: 'LIKE' | 'PASS' },
) {
  // Verify the encounter exists and involves the swiper
  const encounter = await prisma.encounter.findUnique({
    where: { id: data.encounterId },
  });

  if (!encounter) {
    throw new SwipeError('Encounter not found.');
  }

  // Verify the swiper is part of this encounter
  if (encounter.userAId !== swiperId && encounter.userBId !== swiperId) {
    throw new SwipeError('You are not part of this encounter.');
  }

  // Verify the target is the other person in the encounter
  const expectedTarget = encounter.userAId === swiperId ? encounter.userBId : encounter.userAId;
  if (data.targetId !== expectedTarget) {
    throw new SwipeError('Target does not match the encounter.');
  }

  // Check for block
  const blocked = await prisma.block.findFirst({
    where: {
      OR: [
        { blockerId: swiperId, blockedId: data.targetId },
        { blockerId: data.targetId, blockedId: swiperId },
      ],
    },
  });
  if (blocked) {
    throw new SwipeError('Cannot swipe on this profile.');
  }

  // Check if already swiped
  const existing = await prisma.swipe.findUnique({
    where: { swiperId_encounterId: { swiperId, encounterId: data.encounterId } },
  });
  if (existing) {
    throw new SwipeError('Already swiped on this encounter.');
  }

  // Create the swipe
  const swipe = await prisma.swipe.create({
    data: {
      swiperId,
      targetId: data.targetId,
      encounterId: data.encounterId,
      direction: data.direction,
    },
  });

  let match = null;

  // Check for mutual LIKE
  if (data.direction === 'LIKE') {
    const reciprocal = await prisma.swipe.findFirst({
      where: {
        swiperId: data.targetId,
        targetId: swiperId,
        encounterId: data.encounterId,
        direction: 'LIKE',
      },
    });

    if (reciprocal) {
      // Mutual match! Determine consistent A/B ordering (lower ID = A)
      const [userAId, userBId] = [swiperId, data.targetId].sort();
      const [swipeAId, swipeBId] =
        userAId === swiperId ? [swipe.id, reciprocal.id] : [reciprocal.id, swipe.id];

      match = await prisma.match.create({
        data: {
          userAId,
          userBId,
          encounterId: data.encounterId,
          swipeAId,
          swipeBId,
        },
      });

      // Create chat thread
      await prisma.chatThread.create({
        data: {
          matchId: match.id,
          userAId,
          userBId,
        },
      });

      // Enqueue push notifications for both users (handled by notification job)
      try {
        const redis = getRedis();
        await redis.lpush(
          'bull:notification:wait',
          JSON.stringify({
            type: 'match',
            matchId: match.id,
            userIds: [swiperId, data.targetId],
          }),
        );
      } catch {
        // Non-critical: notification failure shouldn't block the match
      }
    }
  }

  return { swipe, match, isMatch: match !== null };
}

export async function listMatches(userId: string) {
  const matches = await prisma.match.findMany({
    where: {
      isActive: true,
      OR: [{ userAId: userId }, { userBId: userId }],
    },
    include: {
      encounter: {
        include: {
          event: { select: { name: true, venueName: true } },
        },
      },
      chatThread: {
        select: {
          id: true,
          lastMessageAt: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return matches.map((m) => ({
    id: m.id,
    otherUserId: m.userAId === userId ? m.userBId : m.userAId,
    encounterQuality: m.encounter.quality,
    eventName: m.encounter.event.name,
    chatThreadId: m.chatThread?.id ?? null,
    lastMessageAt: m.chatThread?.lastMessageAt ?? null,
    createdAt: m.createdAt,
  }));
}

export class SwipeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SwipeError';
  }
}
