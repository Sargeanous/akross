import { getPrisma } from '../../config/prisma.js';
import type { ReportStatus, EventStatus } from '@prisma/client';

const prisma = getPrisma();

// ─── Report Management ───────────────────────────────────────────────────────

export async function listReports(filters?: {
  status?: ReportStatus;
  cursor?: string;
  limit?: number;
}) {
  const limit = filters?.limit ?? 20;

  return prisma.report.findMany({
    where: filters?.status ? { status: filters.status } : undefined,
    include: {
      reporter: { select: { id: true, phone: true, email: true } },
      reported: { select: { id: true, phone: true, email: true, isBanned: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
    ...(filters?.cursor ? { cursor: { id: filters.cursor }, skip: 1 } : {}),
  });
}

export async function updateReport(
  reportId: string,
  moderatorId: string,
  data: { status?: ReportStatus; resolution?: string },
) {
  return prisma.report.update({
    where: { id: reportId },
    data: {
      ...data,
      moderatorId,
      ...(data.status === 'RESOLVED' || data.status === 'DISMISSED'
        ? { resolvedAt: new Date() }
        : {}),
    },
  });
}

// ─── User Management ─────────────────────────────────────────────────────────

export async function banUser(userId: string) {
  const user = await prisma.user.update({
    where: { id: userId },
    data: { isBanned: true },
  });

  // Deactivate all sessions, matches, and threads
  await prisma.proximitySession.updateMany({
    where: { userId, isActive: true },
    data: { isActive: false, endedAt: new Date() },
  });

  await prisma.match.updateMany({
    where: {
      isActive: true,
      OR: [{ userAId: userId }, { userBId: userId }],
    },
    data: { isActive: false },
  });

  await prisma.chatThread.updateMany({
    where: {
      isActive: true,
      OR: [{ userAId: userId }, { userBId: userId }],
    },
    data: { isActive: false },
  });

  return user;
}

// ─── Event Management ────────────────────────────────────────────────────────

export async function listAdminEvents() {
  return prisma.proximityEvent.findMany({
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { sessions: true } } },
  });
}

export async function createEvent(
  createdById: string,
  data: {
    name: string;
    description?: string;
    venueName: string;
    latitude: number;
    longitude: number;
    startsAt: string;
    endsAt: string;
    maxParticipants?: number;
  },
) {
  return prisma.proximityEvent.create({
    data: {
      name: data.name,
      description: data.description ?? null,
      venueName: data.venueName,
      latitude: data.latitude,
      longitude: data.longitude,
      startsAt: new Date(data.startsAt),
      endsAt: new Date(data.endsAt),
      status: 'ACTIVE',
      maxParticipants: data.maxParticipants ?? null,
      createdById,
    },
  });
}

export async function updateEvent(
  eventId: string,
  data: Partial<{
    name: string;
    description: string;
    venueName: string;
    latitude: number;
    longitude: number;
    startsAt: string;
    endsAt: string;
    maxParticipants: number;
    status: EventStatus;
  }>,
) {
  const { startsAt, endsAt, ...rest } = data;
  return prisma.proximityEvent.update({
    where: { id: eventId },
    data: {
      ...rest,
      ...(startsAt ? { startsAt: new Date(startsAt) } : {}),
      ...(endsAt ? { endsAt: new Date(endsAt) } : {}),
    },
  });
}
