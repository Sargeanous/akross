import { PrismaClient } from '@prisma/client';
import { getEnv } from './env.js';

let _prisma: PrismaClient | null = null;

export function getPrisma(): PrismaClient {
  if (!_prisma) {
    _prisma = new PrismaClient({
      log: getEnv().NODE_ENV === 'development' ? ['query', 'warn', 'error'] : ['error'],
    });
  }
  return _prisma;
}

export async function disconnectPrisma(): Promise<void> {
  if (_prisma) {
    await _prisma.$disconnect();
    _prisma = null;
  }
}
