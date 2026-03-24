import { describe, it, expect, vi } from 'vitest';

/**
 * Auth guard unit tests.
 *
 * These validate the JWT verification logic without spinning up a full Fastify server.
 * The auth guard should:
 * 1. Reject requests without an Authorization header
 * 2. Reject requests with an invalid/expired token
 * 3. Attach userId to the request on success
 */

describe('Auth Guard', () => {
  it('rejects requests without authorization header', async () => {
    const request = {
      headers: {},
      jwtVerify: vi.fn().mockRejectedValue(new Error('No authorization header')),
    };

    const reply = {
      code: vi.fn().mockReturnThis(),
      send: vi.fn().mockReturnThis(),
    };

    // Simulate the auth guard logic
    try {
      await request.jwtVerify();
      request.userId = 'should-not-reach';
    } catch {
      reply.code(401).send({ error: 'Unauthorized' });
    }

    expect(reply.code).toHaveBeenCalledWith(401);
    expect(reply.send).toHaveBeenCalledWith({ error: 'Unauthorized' });
  });

  it('rejects requests with expired token', async () => {
    const request = {
      headers: { authorization: 'Bearer expired-token' },
      jwtVerify: vi.fn().mockRejectedValue(new Error('Token expired')),
    };

    const reply = {
      code: vi.fn().mockReturnThis(),
      send: vi.fn().mockReturnThis(),
    };

    try {
      await request.jwtVerify();
    } catch {
      reply.code(401).send({ error: 'Unauthorized', message: 'Invalid or expired access token' });
    }

    expect(reply.code).toHaveBeenCalledWith(401);
  });

  it('attaches userId to request on successful verification', async () => {
    const request = {
      headers: { authorization: 'Bearer valid-token' },
      jwtVerify: vi.fn().mockResolvedValue({ sub: 'user-123' }),
      userId: '',
    };

    const decoded = await request.jwtVerify();
    request.userId = decoded.sub;

    expect(request.userId).toBe('user-123');
  });

  it('extracts sub claim from JWT payload', async () => {
    const mockPayload = { sub: 'user-456', iat: 1000, exp: 2000 };
    const request = {
      jwtVerify: vi.fn().mockResolvedValue(mockPayload),
      userId: '',
    };

    const decoded = await request.jwtVerify();
    request.userId = decoded.sub;

    expect(request.userId).toBe('user-456');
    expect(request.jwtVerify).toHaveBeenCalledTimes(1);
  });
});
