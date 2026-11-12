import { randomInt } from 'node:crypto';
import type { Db } from '../db';
import { hashPassword, newSessionToken, sha256, verifyPassword } from '../lib/crypto';
import { conflict, unauthorized } from '../lib/errors';
import { ensureProfile } from './playerService';

export interface RegisterInput {
  username: string;
  email: string;
  password: string;
}

export async function createSession(db: Db, userId: string, ttlDays: number): Promise<{ token: string; expiresAt: Date }> {
  const token = newSessionToken();
  const expiresAt = new Date(Date.now() + ttlDays * 24 * 3600 * 1000);
  await db.session.create({ data: { tokenHash: sha256(token), userId, expiresAt } });
  await db.user.update({ where: { id: userId }, data: { lastLoginAt: new Date() } });
  return { token, expiresAt };
}

export async function findSession(db: Db, token: string) {
  const session = await db.session.findUnique({ where: { tokenHash: sha256(token) }, include: { user: true } });
  if (!session) return null;
  if (session.expiresAt < new Date()) {
    await db.session.delete({ where: { id: session.id } }).catch(() => undefined);
    return null;
  }
  return session;
}

export async function destroySession(db: Db, token: string): Promise<void> {
  await db.session.deleteMany({ where: { tokenHash: sha256(token) } });
}

async function assertAvailable(db: Db, username: string, email: string, exceptUserId?: string) {
  const byName = await db.user.findFirst({ where: { username: { equals: username, mode: 'insensitive' } } });
  if (byName && byName.id !== exceptUserId) throw conflict('That username is already taken');
  const byEmail = await db.user.findFirst({ where: { email: { equals: email, mode: 'insensitive' } } });
  if (byEmail && byEmail.id !== exceptUserId) throw conflict('An account with that email already exists');
}

/**
 * Registers a new account. If `guestUserId` is given (the caller is playing
 * as a guest) the guest account is converted in place so progress is kept.
 */
export async function register(db: Db, input: RegisterInput, guestUserId?: string) {
  const username = input.username.trim();
  const email = input.email.trim().toLowerCase();
  await assertAvailable(db, username, email, guestUserId);
  const passwordHash = await hashPassword(input.password);
  if (guestUserId) {
    const guest = await db.user.findUnique({ where: { id: guestUserId } });
    if (guest?.isGuest) {
      const user = await db.user.update({ where: { id: guestUserId }, data: { username, email, passwordHash, isGuest: false } });
      await ensureProfile(db, user.id);
      return user;
    }
  }
  const user = await db.user.create({ data: { username, email, passwordHash } });
  await ensureProfile(db, user.id);
  return user;
}

export async function login(db: Db, identifier: string, password: string) {
  const id = identifier.trim();
  const user = await db.user.findFirst({
    where: {
      isGuest: false,
      OR: [{ username: { equals: id, mode: 'insensitive' } }, { email: { equals: id.toLowerCase(), mode: 'insensitive' } }],
    },
  });
  // Always run a hash comparison to keep timing similar for unknown users.
  const ok = user?.passwordHash ? await verifyPassword(password, user.passwordHash) : await hashPassword(password).then(() => false);
  if (!user || !ok) throw unauthorized('Wrong username/email or password');
  await ensureProfile(db, user.id);
  return user;
}

export async function createGuest(db: Db) {
  for (let attempt = 0; attempt < 5; attempt++) {
    const username = `Guest-${randomInt(100000, 999999)}`;
    const exists = await db.user.findUnique({ where: { username } });
    if (exists) continue;
    const user = await db.user.create({ data: { username, isGuest: true } });
    await ensureProfile(db, user.id);
    return user;
  }
  throw conflict('Could not create a guest account, please retry');
}
