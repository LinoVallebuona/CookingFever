import type { FastifyInstance } from 'fastify';
import { createGuest, createSession, destroySession, login, register } from '../services/authService';
import { getPlayerState } from '../services/playerService';
import { SESSION_COOKIE } from '../plugins/auth';
import { LoginSchema, RegisterSchema } from './schemas';

export async function authRoutes(app: FastifyInstance) {
  const authRate = { config: { rateLimit: { max: 20, timeWindow: '1 minute' } } };

  app.post('/register', authRate, async (req, reply) => {
    const body = RegisterSchema.parse(req.body);
    // A guest registering keeps their progress (guest account is converted).
    const guestId = req.auth?.isGuest ? req.auth.id : undefined;
    const user = await register(app.db, body, guestId);
    if (req.sessionToken) await destroySession(app.db, req.sessionToken);
    const { token, expiresAt } = await createSession(app.db, user.id, app.env.SESSION_TTL_DAYS);
    app.setSessionCookie(reply, token, expiresAt);
    req.log.info({ userId: user.id, convertedGuest: !!guestId }, 'user registered');
    return reply.code(201).send(await getPlayerState(app.db, user.id));
  });

  app.post('/login', authRate, async (req, reply) => {
    const body = LoginSchema.parse(req.body);
    const user = await login(app.db, body.identifier, body.password);
    if (req.sessionToken) await destroySession(app.db, req.sessionToken);
    const { token, expiresAt } = await createSession(app.db, user.id, app.env.SESSION_TTL_DAYS);
    app.setSessionCookie(reply, token, expiresAt);
    return getPlayerState(app.db, user.id);
  });

  app.post('/guest', authRate, async (req, reply) => {
    const user = await createGuest(app.db);
    const { token, expiresAt } = await createSession(app.db, user.id, app.env.SESSION_TTL_DAYS);
    app.setSessionCookie(reply, token, expiresAt);
    return reply.code(201).send(await getPlayerState(app.db, user.id));
  });

  app.post('/logout', async (req, reply) => {
    if (req.sessionToken) await destroySession(app.db, req.sessionToken);
    reply.clearCookie(SESSION_COOKIE, { path: '/' });
    return { ok: true };
  });

  app.get('/me', { preHandler: app.requireAuth }, async (req) => getPlayerState(app.db, req.auth!.id));
}
