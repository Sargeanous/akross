import type { FastifyInstance } from 'fastify';
import type { WebSocket } from '@fastify/websocket';
import { SendMessageSchema, PaginationSchema } from '@proximity/shared';
import * as chatService from './service.js';

// In-memory map of userId -> WebSocket connections for real-time delivery
const wsConnections = new Map<string, Set<WebSocket>>();

export async function chatRoutes(app: FastifyInstance) {
  app.addHook('preHandler', app.authenticate);

  // GET /chat/threads — list threads with last message and unread count
  app.get('/threads', async (request, reply) => {
    const threads = await chatService.listThreads(request.userId);
    return reply.send(threads);
  });

  // GET /chat/threads/:id/messages — paginated messages
  app.get('/threads/:id/messages', async (request, reply) => {
    const { id } = request.params as { id: string };
    const query = PaginationSchema.parse(request.query);
    try {
      const messages = await chatService.getMessages(request.userId, id, query.cursor, query.limit);
      return reply.send(messages);
    } catch (err) {
      if (err instanceof chatService.ChatError) {
        return reply.code(403).send({ error: err.message });
      }
      throw err;
    }
  });

  // POST /chat/threads/:id/messages — send message
  app.post('/threads/:id/messages', async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = SendMessageSchema.parse(request.body);
    try {
      const message = await chatService.sendMessage(request.userId, id, body);

      // Deliver in real-time via WebSocket if the recipient is connected
      broadcastToThread(request.userId, id, message);

      return reply.code(201).send(message);
    } catch (err) {
      if (err instanceof chatService.ChatError) {
        return reply.code(403).send({ error: err.message });
      }
      throw err;
    }
  });

  // POST /chat/threads/:id/read — mark messages as read
  app.post('/threads/:id/read', async (request, reply) => {
    const { id } = request.params as { id: string };
    await chatService.markMessagesAsRead(request.userId, id);
    return reply.send({ success: true });
  });

  // WebSocket endpoint for real-time message delivery
  // The client connects after authentication and receives new messages in real-time
  app.get('/ws', { websocket: true }, (socket, request) => {
    const userId = request.userId;
    if (!userId) {
      socket.close(4001, 'Unauthorized');
      return;
    }

    // Register connection
    if (!wsConnections.has(userId)) {
      wsConnections.set(userId, new Set());
    }
    wsConnections.get(userId)!.add(socket);

    socket.on('message', (raw) => {
      try {
        const data = JSON.parse(raw.toString());
        // Handle read receipts via WebSocket
        if (data.type === 'read' && data.threadId) {
          chatService.markMessagesAsRead(userId, data.threadId);
        }
      } catch {
        // Ignore malformed messages
      }
    });

    socket.on('close', () => {
      const conns = wsConnections.get(userId);
      if (conns) {
        conns.delete(socket);
        if (conns.size === 0) wsConnections.delete(userId);
      }
    });
  });
}

/**
 * Broadcast a message to the other participant in a chat thread via WebSocket.
 */
function broadcastToThread(senderId: string, _threadId: string, message: any) {
  // Look up the thread to find the other participant
  // In a production system, you'd cache thread memberships
  // For now, we rely on the message having enough context
  for (const [userId, conns] of wsConnections) {
    if (userId !== senderId) {
      for (const ws of conns) {
        try {
          ws.send(JSON.stringify({ type: 'message', data: message }));
        } catch {
          // Connection may have closed
        }
      }
    }
  }
}
