import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import jwt from '@fastify/jwt';
import websocket from '@fastify/websocket';
import { RATE_LIMITS, AUTH } from '@proximity/shared';
import { loadEnv } from './config/env.js';
import { disconnectPrisma } from './config/prisma.js';
import { disconnectRedis, getRedis } from './config/redis.js';
import authPlugin from './plugins/auth.js';
import { authRoutes } from './modules/auth/routes.js';
import { profileRoutes } from './modules/profile/routes.js';
import { eventRoutes } from './modules/event/routes.js';
import { encounterRoutes } from './modules/encounter/routes.js';
import { swipeRoutes } from './modules/swipe/routes.js';
import { chatRoutes } from './modules/chat/routes.js';
import { reportRoutes } from './modules/report/routes.js';
import { adminRoutes } from './modules/admin/routes.js';
import { registerWorkers } from './jobs/index.js';

const env = loadEnv();

const app = Fastify({
  logger: {
    level: env.NODE_ENV === 'production' ? 'info' : 'debug',
  },
});

async function bootstrap() {
  // ─── Core plugins ────────────────────────────────────────────────────
  await app.register(cors, { origin: true });
  await app.register(helmet);
  await app.register(rateLimit, {
    max: RATE_LIMITS.GLOBAL_RPM,
    timeWindow: '1 minute',
    redis: getRedis(),
  });
  await app.register(jwt, {
    secret: env.JWT_SECRET,
    sign: { expiresIn: `${AUTH.ACCESS_TOKEN_TTL_S}s` },
  });
  await app.register(websocket);

  // ─── Auth plugin (decorates request with userId) ─────────────────────
  await app.register(authPlugin);

  // ─── Route modules ───────────────────────────────────────────────────
  await app.register(authRoutes, { prefix: '/auth' });
  await app.register(profileRoutes, { prefix: '/profile' });
  await app.register(eventRoutes, { prefix: '/events' });
  await app.register(encounterRoutes, { prefix: '/encounters' });
  await app.register(swipeRoutes, { prefix: '/swipe' });
  await app.register(chatRoutes, { prefix: '/chat' });
  await app.register(reportRoutes);
  await app.register(adminRoutes, { prefix: '/admin' });

  // ─── Health check ────────────────────────────────────────────────────
  app.get('/health', async () => ({ status: 'ok' }));

  // ─── Start background workers ────────────────────────────────────────
  registerWorkers();

  // ─── Start server ────────────────────────────────────────────────────
  await app.listen({ port: env.PORT, host: '0.0.0.0' });
  app.log.info(`Server running on port ${env.PORT}`);
}

// ─── Graceful shutdown ─────────────────────────────────────────────────────
async function shutdown() {
  app.log.info('Shutting down...');
  await app.close();
  await disconnectRedis();
  await disconnectPrisma();
  process.exit(0);
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

bootstrap().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

export { app };
