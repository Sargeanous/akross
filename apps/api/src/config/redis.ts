import Redis from 'ioredis';
import { getEnv } from './env.js';

let _redis: Redis | null = null;

export function getRedis(): Redis {
  if (!_redis) {
    _redis = new Redis(getEnv().REDIS_URL, {
      maxRetriesPerRequest: null, // Required by BullMQ
    });
  }
  return _redis;
}

/** Return Redis URL for BullMQ connections (avoids ioredis version mismatch) */
export function getRedisUrl(): string {
  return getEnv().REDIS_URL;
}

export async function disconnectRedis(): Promise<void> {
  if (_redis) {
    await _redis.quit();
    _redis = null;
  }
}
