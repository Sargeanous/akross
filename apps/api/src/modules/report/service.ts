import { getPrisma } from '../../config/prisma.js';
import type { ReportReason } from '@prisma/client';

const prisma = getPrisma();

export async function createReport(
  reporterId: string,
  data: { reportedId: string; reason: ReportReason; description?: string },
) {
  if (reporterId === data.reportedId) {
    throw new ReportError('Cannot report yourself.');
  }

  return prisma.report.create({
    data: {
      reporterId,
      reportedId: data.reportedId,
      reason: data.reason,
      description: data.description ?? null,
    },
  });
}

export async function blockUser(blockerId: string, blockedId: string) {
  if (blockerId === blockedId) {
    throw new ReportError('Cannot block yourself.');
  }

  const existing = await prisma.block.findUnique({
    where: { blockerId_blockedId: { blockerId, blockedId } },
  });
  if (existing) {
    throw new ReportError('User already blocked.');
  }

  const block = await prisma.block.create({
    data: { blockerId, blockedId },
  });

  // Deactivate any active matches between these users
  await prisma.match.updateMany({
    where: {
      isActive: true,
      OR: [
        { userAId: blockerId, userBId: blockedId },
        { userAId: blockedId, userBId: blockerId },
      ],
    },
    data: { isActive: false },
  });

  // Deactivate chat threads
  await prisma.chatThread.updateMany({
    where: {
      isActive: true,
      OR: [
        { userAId: blockerId, userBId: blockedId },
        { userAId: blockedId, userBId: blockerId },
      ],
    },
    data: { isActive: false },
  });

  return block;
}

export async function unblockUser(blockerId: string, blockId: string) {
  const block = await prisma.block.findFirst({
    where: { id: blockId, blockerId },
  });
  if (!block) throw new ReportError('Block not found.');

  await prisma.block.delete({ where: { id: blockId } });
  return { unblocked: true };
}

export async function listBlocks(blockerId: string) {
  return prisma.block.findMany({
    where: { blockerId },
    orderBy: { createdAt: 'desc' },
  });
}

export class ReportError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ReportError';
  }
}
