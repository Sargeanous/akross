import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import fp from 'fastify-plugin';
import { getEnv } from '../config/env.js';

declare module 'fastify' {
  interface FastifyRequest {
    userId: string;
  }
}

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: { sub: string };
    user: { sub: string };
  }
}

/**
 * Auth guard — verifies the JWT access token from the Authorization header
 * and attaches userId to the request. Use as a preHandler on protected routes.
 */
async function authPlugin(fastify: FastifyInstance) {
  fastify.decorateRequest('userId', '');

  fastify.decorate('authenticate', async function (request: FastifyRequest, reply: FastifyReply) {
    try {
      const decoded = await request.jwtVerify<{ sub: string }>();
      request.userId = decoded.sub;
    } catch {
      reply.code(401).send({ error: 'Unauthorized', message: 'Invalid or expired access token' });
    }
  });
}

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}

export default fp(authPlugin, { name: 'auth' });
