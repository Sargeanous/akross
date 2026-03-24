import type { FastifyInstance } from 'fastify';
import * as eventService from './service.js';

export async function eventRoutes(app: FastifyInstance) {
  // All event routes require authentication
  app.addHook('preHandler', app.authenticate);

  // GET /events — list active/upcoming events
  app.get('/', async (_request, reply) => {
    const events = await eventService.listEvents();
    return reply.send(events);
  });

  // GET /events/:id — event detail
  app.get('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    try {
      const event = await eventService.getEventById(id);
      return reply.send(event);
    } catch (err) {
      if (err instanceof eventService.EventError) {
        return reply.code(404).send({ error: err.message });
      }
      throw err;
    }
  });

  // POST /events/:id/join — join event, start session, receive token batch
  app.post('/:id/join', async (request, reply) => {
    const { id } = request.params as { id: string };
    try {
      const result = await eventService.joinEvent(request.userId, id);
      return reply.code(200).send(result);
    } catch (err) {
      if (err instanceof eventService.EventError) {
        return reply.code(400).send({ error: err.message });
      }
      throw err;
    }
  });
}
