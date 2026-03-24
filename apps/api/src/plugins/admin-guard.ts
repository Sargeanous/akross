import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import fp from 'fastify-plugin';
import { getPrisma } from '../config/prisma.js';

/**
 * Admin guard — checks that the authenticated user has isAdmin = true.
 * Must be used AFTER the auth plugin (which sets request.userId).
 */
async function adminGuardPlugin(fastify: FastifyInstance) {
  fastify.decorate(
    'requireAdmin',
    async function (request: FastifyRequest, reply: FastifyReply) {
      // Auth guard must run first
      if (!request.userId) {
        reply.code(401).send({ error: 'Unauthorized' });
        return;
      }

      const prisma = getPrisma();
      const user = await prisma.user.findUnique({
        where: { id: request.userId },
        select: { isAdmin: true, isBanned: true },
      });

      if (!user || user.isBanned) {
        reply.code(403).send({ error: 'Forbidden' });
        return;
      }

      if (!user.isAdmin) {
        reply.code(403).send({ error: 'Admin access required' });
        return;
      }
    },
  );
}

declare module 'fastify' {
  interface FastifyInstance {
    requireAdmin: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}

export default fp(adminGuardPlugin, { name: 'admin-guard', dependencies: ['auth'] });
