import cookie from '@fastify/cookie';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import fastifyStatic from '@fastify/static';
import Fastify, { type FastifyError } from 'fastify';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { ZodError, z } from 'zod';
import type { Db } from './db';
import type { Env } from './env';
import { AppError } from './lib/errors';
import { authPlugin } from './plugins/auth';
import { authRoutes } from './routes/auth';
import { configRoutes, playerRoutes, sessionRoutes } from './routes/game';

export interface BuildAppOptions {
  env: Env;
  db: Db;
}

export async function buildApp({ env, db }: BuildAppOptions) {
  const app = Fastify({
    logger:
      env.NODE_ENV === 'test'
        ? false
        : {
            level: env.LOG_LEVEL,
            transport: env.NODE_ENV === 'development' ? { target: 'pino-pretty', options: { translateTime: 'HH:MM:ss', ignore: 'pid,hostname' } } : undefined,
          },
    trustProxy: true,
    bodyLimit: 2 * 1024 * 1024,
  });

  app.decorate('db', db);
  app.decorate('env', env);

  await app.register(cookie, { secret: env.COOKIE_SECRET });
  await app.register(cors, {
    origin: env.CORS_ORIGIN.split(',').map((s) => s.trim()),
    credentials: true,
  });
  await app.register(rateLimit, { max: 600, timeWindow: '1 minute', enableDraftSpec: true, allowList: env.NODE_ENV === 'test' ? () => true : undefined });
  await app.register(authPlugin);

  app.setErrorHandler((err: FastifyError | Error, req, reply) => {
    if (err instanceof AppError) {
      return reply.code(err.statusCode).send({ error: err.code, message: err.message, details: err.details });
    }
    if (err instanceof ZodError) {
      const first = err.issues[0];
      return reply.code(400).send({ error: 'VALIDATION_ERROR', message: first?.message ?? 'Invalid request', details: z.flattenError(err) });
    }
    const fe = err as FastifyError;
    if (fe.statusCode && fe.statusCode < 500) {
      return reply.code(fe.statusCode).send({ error: fe.code ?? 'BAD_REQUEST', message: fe.message });
    }
    req.log.error({ err }, 'unhandled error');
    return reply.code(500).send({ error: 'INTERNAL', message: 'Something went wrong on our side. Please try again.' });
  });

  app.get('/api/health', async () => {
    await db.$queryRaw`SELECT 1`;
    return { ok: true, time: new Date().toISOString() };
  });

  await app.register(authRoutes, { prefix: '/api/auth' });
  await app.register(configRoutes, { prefix: '/api/config' });
  await app.register(playerRoutes, { prefix: '/api/player' });
  await app.register(sessionRoutes, { prefix: '/api/game' });

  // In production the API also serves the built client (single origin).
  const clientDist = path.resolve(process.cwd(), env.CLIENT_DIST);
  if (env.NODE_ENV !== 'test' && existsSync(path.join(clientDist, 'index.html'))) {
    await app.register(fastifyStatic, { root: clientDist, wildcard: false });
    app.setNotFoundHandler((req, reply) => {
      if (req.url.startsWith('/api/')) return reply.code(404).send({ error: 'NOT_FOUND', message: 'Route not found' });
      return reply.sendFile('index.html');
    });
    app.log.info({ clientDist }, 'serving client build');
  } else {
    app.setNotFoundHandler((_req, reply) => reply.code(404).send({ error: 'NOT_FOUND', message: 'Route not found' }));
  }

  return app;
}
