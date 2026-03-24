import { z } from 'zod';

const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3000),

  // Database
  DATABASE_URL: z.string().url(),

  // Redis
  REDIS_URL: z.string().url(),

  // JWT
  JWT_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),

  // S3-compatible object storage
  S3_BUCKET: z.string().min(1),
  S3_REGION: z.string().default('us-east-1'),
  S3_ACCESS_KEY: z.string().min(1),
  S3_SECRET_KEY: z.string().min(1),
  S3_ENDPOINT: z.string().url(),

  // Providers (stubbed for MVP)
  OTP_PROVIDER: z.string().default('console'),
  PUSH_PROVIDER: z.string().default('console'),
});

export type Env = z.infer<typeof EnvSchema>;

let _env: Env | null = null;

export function loadEnv(): Env {
  if (_env) return _env;
  const result = EnvSchema.safeParse(process.env);
  if (!result.success) {
    console.error('Invalid environment variables:', result.error.flatten().fieldErrors);
    process.exit(1);
  }
  _env = result.data;
  return _env;
}

export function getEnv(): Env {
  if (!_env) return loadEnv();
  return _env;
}
