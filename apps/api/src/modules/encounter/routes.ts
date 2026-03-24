import type { FastifyInstance } from 'fastify';
import { EncounterUploadSchema } from '@proximity/shared';
import * as encounterService from './service.js';

export async function encounterRoutes(app: FastifyInstance) {
  app.addHook('preHandler', app.authenticate);

  // POST /encounters/tokens — request new BLE token batch
  app.post('/tokens', async (request, reply) => {
    const { sessionId } = request.body as { sessionId: string };
    if (!sessionId) {
      return reply.code(400).send({ error: 'sessionId is required' });
    }
    try {
      const tokens = await encounterService.requestTokens(request.userId, sessionId);
      return reply.send({ tokens });
    } catch (err) {
      if (err instanceof encounterService.EncounterError) {
        return reply.code(400).send({ error: err.message });
      }
      throw err;
    }
  });

  // POST /encounters/upload — upload BLE observations
  app.post('/upload', async (request, reply) => {
    const body = EncounterUploadSchema.parse(request.body);
    try {
      const result = await encounterService.uploadObservations(request.userId, body);
      return reply.code(201).send(result);
    } catch (err) {
      if (err instanceof encounterService.EncounterError) {
        return reply.code(400).send({ error: err.message });
      }
      throw err;
    }
  });

  // GET /encounters — list my verified encounters (swipe candidates)
  app.get('/', async (request, reply) => {
    const encounters = await encounterService.listEncounters(request.userId);
    return reply.send(encounters);
  });
}
