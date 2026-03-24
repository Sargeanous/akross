import type { FastifyInstance } from 'fastify';
import { CreateProfileSchema, UpdateProfileSchema } from '@proximity/shared';
import * as profileService from './service.js';

export async function profileRoutes(app: FastifyInstance) {
  // All profile routes require authentication
  app.addHook('preHandler', app.authenticate);

  // POST /profile — create profile (age-gated to 18+)
  app.post('/', async (request, reply) => {
    const body = CreateProfileSchema.parse(request.body);
    try {
      const profile = await profileService.createProfile(request.userId, body);
      return reply.code(201).send(profile);
    } catch (err) {
      if (err instanceof profileService.ProfileError) {
        return reply.code(400).send({ error: err.message });
      }
      throw err;
    }
  });

  // GET /profile/me — get own profile
  app.get('/me', async (request, reply) => {
    try {
      const profile = await profileService.getMyProfile(request.userId);
      return reply.send(profile);
    } catch (err) {
      if (err instanceof profileService.ProfileError) {
        return reply.code(404).send({ error: err.message });
      }
      throw err;
    }
  });

  // PATCH /profile — update profile fields
  app.patch('/', async (request, reply) => {
    const body = UpdateProfileSchema.parse(request.body);
    try {
      const profile = await profileService.updateProfile(request.userId, body);
      return reply.send(profile);
    } catch (err) {
      if (err instanceof profileService.ProfileError) {
        return reply.code(400).send({ error: err.message });
      }
      throw err;
    }
  });

  // POST /profile/photos — upload photo (presigned URL flow)
  app.post('/photos', async (request, reply) => {
    const { contentType } = request.body as { contentType?: string };
    if (!contentType) {
      return reply.code(400).send({ error: 'contentType is required' });
    }
    try {
      const result = await profileService.createPhotoUpload(request.userId, contentType);
      return reply.code(201).send(result);
    } catch (err) {
      if (err instanceof profileService.ProfileError) {
        return reply.code(400).send({ error: err.message });
      }
      throw err;
    }
  });

  // DELETE /profile/photos/:id — remove photo
  app.delete('/photos/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    try {
      const result = await profileService.deletePhoto(request.userId, id);
      return reply.send(result);
    } catch (err) {
      if (err instanceof profileService.ProfileError) {
        return reply.code(404).send({ error: err.message });
      }
      throw err;
    }
  });

  // POST /profile/device-token — register a push notification device token
  app.post('/device-token', async (request, reply) => {
    const { token, platform } = request.body as { token?: string; platform?: string };
    if (!token || !platform) {
      return reply.code(400).send({ error: 'token and platform are required' });
    }
    if (platform !== 'IOS' && platform !== 'ANDROID') {
      return reply.code(400).send({ error: 'platform must be IOS or ANDROID' });
    }
    try {
      const result = await profileService.registerDeviceToken(request.userId, token, platform);
      return reply.send(result);
    } catch (err) {
      if (err instanceof profileService.ProfileError) {
        return reply.code(400).send({ error: err.message });
      }
      throw err;
    }
  });

  // DELETE /profile/device-token — unregister device token (e.g. on logout)
  app.delete('/device-token', async (request, reply) => {
    const { token } = request.body as { token?: string };
    if (!token) {
      return reply.code(400).send({ error: 'token is required' });
    }
    await profileService.removeDeviceToken(request.userId, token);
    return reply.send({ removed: true });
  });

  // GET /profile/:id — get another user's profile (encounter-gated)
  app.get('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    try {
      const profile = await profileService.getProfileById(request.userId, id);
      return reply.send(profile);
    } catch (err) {
      if (err instanceof profileService.ProfileError) {
        return reply.code(403).send({ error: err.message });
      }
      throw err;
    }
  });
}
