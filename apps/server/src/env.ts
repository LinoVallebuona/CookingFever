import 'dotenv/config';
import { z } from 'zod';

const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  PORT: z.coerce.number().int().positive().default(3001),
  HOST: z.string().default('0.0.0.0'),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  COOKIE_SECRET: z.string().min(8).default('dev-cookie-secret-change-me'),
  SESSION_TTL_DAYS: z.coerce.number().positive().default(30),
  LOG_LEVEL: z.enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal', 'silent']).default('info'),
  CLIENT_DIST: z.string().default('../client/dist'),
  /**
   * Anti speed-hack: a run must take at least this fraction of its simulated
   * time in real wall-clock time. Set to 0 to disable (tests).
   */
  MIN_REALTIME_FACTOR: z.coerce.number().min(0).max(1).default(0.85),
});

export type Env = z.infer<typeof EnvSchema>;

export function loadEnv(overrides: Partial<Record<keyof Env, string | number>> = {}): Env {
  const parsed = EnvSchema.safeParse({ ...process.env, ...overrides });
  if (!parsed.success) {
    console.error('Invalid environment configuration:\n' + z.prettifyError(parsed.error));
    process.exit(1);
  }
  return parsed.data;
}
