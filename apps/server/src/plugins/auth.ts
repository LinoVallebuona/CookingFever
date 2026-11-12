import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import fp from 'fastify-plugin';
import type { Env } from '../env';
import type { Db } from '../db';
import { unauthorized } from '../lib/errors';
import { findSession } from '../services/authService';

export const SESSION_COOKIE = 'sizzle_session';

export interface AuthUser {
  id: string;
  username: string;
  isGuest: boolean;
}

declare module 'fastify' {
  interface FastifyInstance {
    db: Db;
    env: Env;
    requireAuth: (req: FastifyRequest, reply: FastifyReply) => Promise<void>;
    setSessionCookie: (reply: FastifyReply, token: string, expiresAt: Date) => void;
  }
  interface FastifyRequest {
    auth: AuthUser | null;
    sessionToken: string | null;
  }
}

/** Resolves the session cookie (or Bearer token) into `request.auth`. */
export const authPlugin = fp(async (app: FastifyInstance) => {
  app.decorateRequest('auth', null);
  app.decorateRequest('sessionToken', null);

  app.addHook('onRequest', async (req) => {
    const header = req.headers.authorization;
    const token = header?.startsWith('Bearer ') ? header.slice(7) : req.cookies[SESSION_COOKIE];
    if (!token) return;
    const session = await findSession(app.db, token);
    if (!session) return;
    req.auth = { id: session.user.id, username: session.user.username, isGuest: session.user.isGuest };
    req.sessionToken = token;
  });

  app.decorate('requireAuth', async (req: FastifyRequest) => {
    if (!req.auth) throw unauthorized();
  });

  app.decorate('setSessionCookie', (reply: FastifyReply, token: string, expiresAt: Date) => {
    reply.setCookie(SESSION_COOKIE, token, {
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      secure: app.env.NODE_ENV === 'production',
      expires: expiresAt,
    });
  });
});
