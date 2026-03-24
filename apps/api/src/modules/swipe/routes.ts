import type { FastifyInstance } from 'fastify';
import { SwipeSchema } from '@proximity/shared';
import * as swipeService from './service.js';

export async function swipeRoutes(app: FastifyInstance) {
  app.addHook('preHandler', app.authenticate);

  // POST /swipe — submit swipe (LIKE/PASS)
  app.post('/', async (request, reply) => {
    const body = SwipeSchema.parse(request.body);
    try {
      const result = await swipeService.submitSwipe(request.userId, body);
      return reply.code(200).send(result);
    } catch (err) {
      if (err instanceof swipeService.SwipeError) {
        return reply.code(400).send({ error: err.message });
      }
      throw err;
    }
  });

  // GET /swipe/matches — list my active matches
  app.get('/matches', async (request, reply) => {
    const matches = await swipeService.listMatches(request.userId);
    return reply.send(matches);
  });
}
