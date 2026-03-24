import type { FastifyInstance } from 'fastify';
import { CreateEventSchema, UpdateEventSchema, UpdateReportSchema } from '@proximity/shared';
import * as adminService from './service.js';

/**
 * Admin routes — protected by both auth and admin guard.
 * Only users with isAdmin = true can access these endpoints.
 */
export async function adminRoutes(app: FastifyInstance) {
  app.addHook('preHandler', app.authenticate);
  app.addHook('preHandler', app.requireAdmin);

  // ─── Reports ─────────────────────────────────────────────────────────

  // GET /admin/reports — list reports with filters
  app.get('/reports', async (request, reply) => {
    const query = request.query as { status?: string; cursor?: string; limit?: string };
    const reports = await adminService.listReports({
      status: query.status as any,
      cursor: query.cursor,
      limit: query.limit ? parseInt(query.limit) : undefined,
    });
    return reply.send(reports);
  });

  // PATCH /admin/reports/:id — update report status/resolution
  app.patch('/reports/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = UpdateReportSchema.parse(request.body);
    const report = await adminService.updateReport(id, request.userId, body);
    return reply.send(report);
  });

  // ─── Users ───────────────────────────────────────────────────────────

  // POST /admin/users/:id/ban — ban user
  app.post('/users/:id/ban', async (request, reply) => {
    const { id } = request.params as { id: string };
    const user = await adminService.banUser(id);
    return reply.send(user);
  });

  // ─── Events ──────────────────────────────────────────────────────────

  // GET /admin/events — list all events
  app.get('/events', async (_request, reply) => {
    const events = await adminService.listAdminEvents();
    return reply.send(events);
  });

  // POST /admin/events — create event
  app.post('/events', async (request, reply) => {
    const body = CreateEventSchema.parse(request.body);
    const event = await adminService.createEvent(request.userId, body);
    return reply.code(201).send(event);
  });

  // PATCH /admin/events/:id — update event
  app.patch('/events/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = UpdateEventSchema.parse(request.body);
    const event = await adminService.updateEvent(id, body);
    return reply.send(event);
  });
}
