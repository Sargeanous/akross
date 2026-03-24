import crypto from 'node:crypto';
import { BLE } from '@proximity/shared';
import { getPrisma } from '../../config/prisma.js';

const prisma = getPrisma();

export async function listEvents(filters?: { status?: string }) {
  return prisma.proximityEvent.findMany({
    where: {
      status: { in: ['ACTIVE', 'DRAFT'] },
      endsAt: { gt: new Date() },
    },
    orderBy: { startsAt: 'asc' },
    select: {
      id: true,
      name: true,
      description: true,
      venueName: true,
      // Approximate location only — never expose exact coordinates to clients
      latitude: true,
      longitude: true,
      startsAt: true,
      endsAt: true,
      status: true,
      maxParticipants: true,
      _count: { select: { sessions: true } },
    },
  });
}

export async function getEventById(eventId: string) {
  const event = await prisma.proximityEvent.findUnique({
    where: { id: eventId },
    include: {
      _count: { select: { sessions: { where: { isActive: true } } } },
    },
  });
  if (!event) throw new EventError('Event not found.');
  return event;
}

/**
 * Join an event: creates a ProximitySession and issues the first batch of BLE tokens.
 * The client uses these tokens for advertising via BLE.
 *
 * Architecture note: tokens are generated server-side so we can later map
 * scanned tokens back to specific users during encounter validation.
 */
export async function joinEvent(userId: string, eventId: string) {
  const event = await prisma.proximityEvent.findUnique({ where: { id: eventId } });
  if (!event) throw new EventError('Event not found.');
  if (event.status !== 'ACTIVE') throw new EventError('Event is not active.');
  if (event.endsAt < new Date()) throw new EventError('Event has ended.');

  // Check capacity
  if (event.maxParticipants) {
    const activeCount = await prisma.proximitySession.count({
      where: { eventId, isActive: true },
    });
    if (activeCount >= event.maxParticipants) {
      throw new EventError('Event is at capacity.');
    }
  }

  // Create or reactivate session
  let session = await prisma.proximitySession.findUnique({
    where: { userId_eventId: { userId, eventId } },
  });

  if (session && session.isActive) {
    throw new EventError('Already joined this event.');
  }

  if (session) {
    session = await prisma.proximitySession.update({
      where: { id: session.id },
      data: { isActive: true, endedAt: null, startedAt: new Date() },
    });
  } else {
    session = await prisma.proximitySession.create({
      data: { userId, eventId },
    });
  }

  // Issue first batch of BLE tokens
  const tokens = await issueTokenBatch(userId, session.id);

  return { session, tokens };
}

/**
 * Generate a batch of BLE tokens for the user's session.
 * Each token is valid for TOKEN_TTL_S and they're meant to be rotated at TOKEN_ROTATION_INTERVAL_S.
 */
export async function issueTokenBatch(userId: string, sessionId: string) {
  const now = Date.now();
  const tokenRecords = [];

  for (let i = 0; i < BLE.BATCH_SIZE; i++) {
    const token = crypto.randomBytes(16).toString('hex');
    const issuedAt = new Date(now + i * BLE.TOKEN_ROTATION_INTERVAL_S * 1000);
    const expiresAt = new Date(issuedAt.getTime() + BLE.TOKEN_TTL_S * 1000);

    tokenRecords.push({
      token,
      userId,
      sessionId,
      issuedAt,
      expiresAt,
    });
  }

  await prisma.proximityTokenRecord.createMany({ data: tokenRecords });

  return tokenRecords.map((t) => ({
    token: t.token,
    issuedAt: t.issuedAt.toISOString(),
    expiresAt: t.expiresAt.toISOString(),
  }));
}

export class EventError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'EventError';
  }
}
