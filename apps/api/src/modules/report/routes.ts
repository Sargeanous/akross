import type { FastifyInstance } from 'fastify';
import { CreateReportSchema, BlockSchema } from '@proximity/shared';
import * as reportService from './service.js';

export async function reportRoutes(app: FastifyInstance) {
  app.addHook('preHandler', app.authenticate);

  // POST /report — create report
  app.post('/report', async (request, reply) => {
    const body = CreateReportSchema.parse(request.body);
    try {
      const report = await reportService.createReport(request.userId, body);
      return reply.code(201).send(report);
    } catch (err) {
      if (err instanceof reportService.ReportError) {
        return reply.code(400).send({ error: err.message });
      }
      throw err;
    }
  });

  // POST /block — block user
  app.post('/block', async (request, reply) => {
    const body = BlockSchema.parse(request.body);
    try {
      const block = await reportService.blockUser(request.userId, body.blockedId);
      return reply.code(201).send(block);
    } catch (err) {
      if (err instanceof reportService.ReportError) {
        return reply.code(400).send({ error: err.message });
      }
      throw err;
    }
  });

  // DELETE /block/:id — unblock
  app.delete('/block/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    try {
      const result = await reportService.unblockUser(request.userId, id);
      return reply.send(result);
    } catch (err) {
      if (err instanceof reportService.ReportError) {
        return reply.code(404).send({ error: err.message });
      }
      throw err;
    }
  });

  // GET /blocks — list blocks
  app.get('/blocks', async (request, reply) => {
    const blocks = await reportService.listBlocks(request.userId);
    return reply.send(blocks);
  });
}
