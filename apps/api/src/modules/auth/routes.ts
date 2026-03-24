import type { FastifyInstance } from 'fastify';
import { OtpRequestSchema, OtpVerifySchema, RefreshTokenSchema } from '@proximity/shared';
import * as authService from './service.js';

export async function authRoutes(app: FastifyInstance) {
  // POST /auth/otp/request — send OTP to phone or magic link to email
  app.post('/otp/request', async (request, reply) => {
    const body = OtpRequestSchema.parse(request.body);

    try {
      const result = await authService.requestOtp(body.target, body.method);
      return reply.code(200).send(result);
    } catch (err) {
      return reply.code(429).send({ error: 'Too many requests' });
    }
  });

  // POST /auth/otp/verify — verify code, create user if new, return JWT pair
  app.post('/otp/verify', async (request, reply) => {
    const body = OtpVerifySchema.parse(request.body);

    try {
      const { user, tokens } = await authService.verifyOtp(body.target, body.code, body.method);
      return reply.code(200).send({
        user: { id: user.id, isVerified: user.isVerified },
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      });
    } catch (err) {
      if (err instanceof authService.OtpError) {
        return reply.code(400).send({ error: err.message });
      }
      throw err;
    }
  });

  // POST /auth/refresh — refresh access token
  app.post('/refresh', async (request, reply) => {
    const body = RefreshTokenSchema.parse(request.body);

    try {
      const tokens = await authService.refreshAccessToken(body.refreshToken);
      return reply.code(200).send(tokens);
    } catch (err) {
      if (err instanceof authService.AuthError) {
        return reply.code(401).send({ error: err.message });
      }
      throw err;
    }
  });

  // POST /auth/logout — revoke refresh token
  app.post('/logout', {
    preHandler: [app.authenticate],
  }, async (request, reply) => {
    const body = RefreshTokenSchema.parse(request.body);
    await authService.revokeRefreshToken(body.refreshToken);
    return reply.code(200).send({ success: true });
  });
}
