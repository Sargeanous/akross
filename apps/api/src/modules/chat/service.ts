import { PAGINATION } from '@proximity/shared';
import { getPrisma } from '../../config/prisma.js';

const prisma = getPrisma();

export async function listThreads(userId: string) {
  const threads = await prisma.chatThread.findMany({
    where: {
      isActive: true,
      OR: [{ userAId: userId }, { userBId: userId }],
    },
    include: {
      messages: {
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
    },
    orderBy: { lastMessageAt: 'desc' },
  });

  // Compute unread counts
  const threadIds = threads.map((t) => t.id);
  const unreadCounts = await prisma.message.groupBy({
    by: ['threadId'],
    where: {
      threadId: { in: threadIds },
      readAt: null,
      senderId: { not: userId }, // Unread messages from the other person
    },
    _count: true,
  });

  const unreadMap = new Map(unreadCounts.map((u) => [u.threadId, u._count]));

  return threads.map((t) => ({
    id: t.id,
    matchId: t.matchId,
    otherUserId: t.userAId === userId ? t.userBId : t.userAId,
    lastMessage: t.messages[0] ?? null,
    unreadCount: unreadMap.get(t.id) ?? 0,
    lastMessageAt: t.lastMessageAt,
    createdAt: t.createdAt,
  }));
}

export async function getMessages(
  userId: string,
  threadId: string,
  cursor?: string,
  limit: number = PAGINATION.DEFAULT_PAGE_SIZE,
) {
  // Verify the user is a participant in this thread
  const thread = await prisma.chatThread.findFirst({
    where: {
      id: threadId,
      OR: [{ userAId: userId }, { userBId: userId }],
    },
  });

  if (!thread) {
    throw new ChatError('Thread not found or you are not a participant.');
  }

  const messages = await prisma.message.findMany({
    where: { threadId },
    orderBy: { createdAt: 'desc' },
    take: limit + 1, // Fetch one extra to check if there are more
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  });

  const hasMore = messages.length > limit;
  if (hasMore) messages.pop();

  return {
    data: messages,
    cursor: messages.length > 0 ? messages[messages.length - 1].id : null,
    hasMore,
  };
}

export async function sendMessage(
  userId: string,
  threadId: string,
  data: { content: string; type: 'TEXT' | 'IMAGE' },
) {
  // Verify the user is a participant
  const thread = await prisma.chatThread.findFirst({
    where: {
      id: threadId,
      isActive: true,
      OR: [{ userAId: userId }, { userBId: userId }],
    },
  });

  if (!thread) {
    throw new ChatError('Thread not found, inactive, or you are not a participant.');
  }

  const message = await prisma.message.create({
    data: {
      threadId,
      senderId: userId,
      type: data.type,
      content: data.content,
    },
  });

  // Update last message time
  await prisma.chatThread.update({
    where: { id: threadId },
    data: { lastMessageAt: message.createdAt },
  });

  return message;
}

export async function markMessagesAsRead(userId: string, threadId: string) {
  // Mark all unread messages from the other person as read
  await prisma.message.updateMany({
    where: {
      threadId,
      senderId: { not: userId },
      readAt: null,
    },
    data: { readAt: new Date() },
  });
}

export class ChatError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ChatError';
  }
}
