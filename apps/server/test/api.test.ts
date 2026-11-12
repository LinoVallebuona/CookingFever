import { DINER_LEVELS, GameEngine, UPGRADES, type PlayerStateDTO, type StartLevelResponse } from '@sizzle/shared';
import { playWithBot } from '@sizzle/shared/bot';
import type { FastifyInstance } from 'fastify';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { Db } from '../src/db';
import { cookieFrom, createTestApp } from './helpers';

let app: FastifyInstance;
let db: Db;

beforeAll(async () => {
  ({ app, db } = await createTestApp());
});
afterAll(async () => {
  await app.close();
  await db.$disconnect();
});

async function registerUser(name: string) {
  const res = await app.inject({ method: 'POST', url: '/api/auth/register', payload: { username: name, email: `${name}@test.dev`, password: 'secret123' } });
  expect(res.statusCode).toBe(201);
  return cookieFrom(res);
}

async function playLevel(cookie: string, levelNumber: number, reaction = 20) {
  const start = await app.inject({ method: 'POST', url: `/api/game/restaurants/diner/levels/${levelNumber}/start`, headers: { cookie } });
  expect(start.statusCode).toBe(200);
  const s = start.json() as StartLevelResponse;
  const engine = GameEngine.create(s.level, s.upgrades, s.seed);
  playWithBot(engine, reaction);
  const res = await app.inject({
    method: 'POST',
    url: `/api/game/sessions/${s.sessionId}/complete`,
    headers: { cookie },
    payload: { actions: engine.actions, clientResult: { revenue: engine.result().revenue, stars: engine.result().stars } },
  });
  return { res, engine, session: s };
}

describe('auth', () => {
  it('registers, reads /me, logs out and logs back in', async () => {
    const cookie = await registerUser('alice');
    const me = await app.inject({ method: 'GET', url: '/api/auth/me', headers: { cookie } });
    expect(me.statusCode).toBe(200);
    const state = me.json() as PlayerStateDTO;
    expect(state.user.username).toBe('alice');
    expect(state.profile.coins).toBe(0);
    expect(state.restaurants[0].levels[0].unlocked).toBe(true);
    expect(state.restaurants[0].levels[1].unlocked).toBe(false);

    const out = await app.inject({ method: 'POST', url: '/api/auth/logout', headers: { cookie } });
    expect(out.statusCode).toBe(200);
    const after = await app.inject({ method: 'GET', url: '/api/auth/me', headers: { cookie } });
    expect(after.statusCode).toBe(401);

    const login = await app.inject({ method: 'POST', url: '/api/auth/login', payload: { identifier: 'ALICE@test.dev', password: 'secret123' } });
    expect(login.statusCode).toBe(200);
    const bad = await app.inject({ method: 'POST', url: '/api/auth/login', payload: { identifier: 'alice', password: 'nope-nope' } });
    expect(bad.statusCode).toBe(401);
  });

  it('stores passwords hashed', async () => {
    await registerUser('bob');
    const user = await db.user.findUnique({ where: { username: 'bob' } });
    expect(user?.passwordHash).toMatch(/^scrypt\$/);
    expect(user?.passwordHash).not.toContain('secret123');
  });

  it('rejects duplicate usernames and weak input', async () => {
    const dup = await app.inject({ method: 'POST', url: '/api/auth/register', payload: { username: 'Alice', email: 'x@test.dev', password: 'secret123' } });
    expect(dup.statusCode).toBe(409);
    const weak = await app.inject({ method: 'POST', url: '/api/auth/register', payload: { username: 'zed', email: 'zed@test.dev', password: '123' } });
    expect(weak.statusCode).toBe(400);
  });

  it('guest can play and later convert to a full account keeping progress', async () => {
    const g = await app.inject({ method: 'POST', url: '/api/auth/guest' });
    expect(g.statusCode).toBe(201);
    const cookie = cookieFrom(g);
    expect((g.json() as PlayerStateDTO).user.isGuest).toBe(true);
    const { res } = await playLevel(cookie, 1);
    expect(res.statusCode).toBe(200);
    const coins = (res.json() as { player: PlayerStateDTO }).player.profile.coins;
    expect(coins).toBeGreaterThan(0);

    const reg = await app.inject({ method: 'POST', url: '/api/auth/register', headers: { cookie }, payload: { username: 'carol', email: 'carol@test.dev', password: 'secret123' } });
    expect(reg.statusCode).toBe(201);
    const state = reg.json() as PlayerStateDTO;
    expect(state.user.isGuest).toBe(false);
    expect(state.profile.coins).toBe(coins);
  });

  it('protects player routes', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/player/state' });
    expect(res.statusCode).toBe(401);
  });
});

describe('levels & server-side validation', () => {
  it('awards server-computed coins and unlocks the next level', async () => {
    const cookie = await registerUser('dave');
    const locked = await app.inject({ method: 'POST', url: '/api/game/restaurants/diner/levels/2/start', headers: { cookie } });
    expect(locked.statusCode).toBe(403);

    const { res, engine } = await playLevel(cookie, 1);
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.result).toEqual(engine.result());
    expect(body.result.passed).toBe(true);
    expect(body.reward.firstClearBonus).toBe(DINER_LEVELS[0].firstClearReward);
    expect(body.newlyUnlockedLevel).toBe(2);
    expect(body.player.profile.coins).toBe(body.reward.total);
    expect(body.player.profile.totalStars).toBe(body.result.stars);
    expect(body.player.restaurants[0].levels[1].unlocked).toBe(true);

    const next = await app.inject({ method: 'POST', url: '/api/game/restaurants/diner/levels/2/start', headers: { cookie } });
    expect(next.statusCode).toBe(200);
  });

  it('ignores client-claimed numbers and recomputes the result', async () => {
    const cookie = await registerUser('eve');
    const start = await app.inject({ method: 'POST', url: '/api/game/restaurants/diner/levels/1/start', headers: { cookie } });
    const s = start.json() as StartLevelResponse;
    // No actions at all: customers all leave, nothing is earned – even if the client claims otherwise.
    const res = await app.inject({
      method: 'POST',
      url: `/api/game/sessions/${s.sessionId}/complete`,
      headers: { cookie },
      payload: { actions: [], clientResult: { revenue: 99999, stars: 3 } },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().result.revenue).toBe(0);
    expect(res.json().result.stars).toBe(0);
    expect(res.json().player.profile.coins).toBe(0);
  });

  it('rejects double submission and forged action logs', async () => {
    const cookie = await registerUser('frank');
    const { res, session, engine } = await playLevel(cookie, 1);
    expect(res.statusCode).toBe(200);
    const again = await app.inject({ method: 'POST', url: `/api/game/sessions/${session.sessionId}/complete`, headers: { cookie }, payload: { actions: engine.actions } });
    expect(again.statusCode).toBe(409);

    const start = await app.inject({ method: 'POST', url: '/api/game/restaurants/diner/levels/1/start', headers: { cookie } });
    const s2 = start.json() as StartLevelResponse;
    const forged = await app.inject({
      method: 'POST',
      url: `/api/game/sessions/${s2.sessionId}/complete`,
      headers: { cookie },
      payload: { actions: [{ t: 50, a: { type: 'bin', bin: 'patty' } }, { t: 10, a: { type: 'bin', bin: 'bun' } }] },
    });
    expect(forged.statusCode).toBe(422);
    const garbage = await app.inject({
      method: 'POST',
      url: `/api/game/sessions/${s2.sessionId}/complete`,
      headers: { cookie },
      payload: { actions: [{ t: 1, a: { type: 'giveMeCoins', amount: 1e9 } }] },
    });
    expect(garbage.statusCode).toBe(400);
  });

  it("cannot submit another player's session", async () => {
    const a = await registerUser('gina');
    const b = await registerUser('hank');
    const start = await app.inject({ method: 'POST', url: '/api/game/restaurants/diner/levels/1/start', headers: { cookie: a } });
    const s = start.json() as StartLevelResponse;
    const res = await app.inject({ method: 'POST', url: `/api/game/sessions/${s.sessionId}/complete`, headers: { cookie: b }, payload: { actions: [] } });
    expect(res.statusCode).toBe(404);
  });
});

describe('upgrades', () => {
  it('charges the database price and refuses when coins are short', async () => {
    const cookie = await registerUser('ivy');
    const poor = await app.inject({ method: 'POST', url: '/api/player/upgrades/purchase', headers: { cookie }, payload: { restaurantId: 'diner', upgradeType: 'grillSpeed' } });
    expect(poor.statusCode).toBe(400);

    await playLevel(cookie, 1);
    const before = (await app.inject({ method: 'GET', url: '/api/player/state', headers: { cookie } })).json() as PlayerStateDTO;
    const cost = UPGRADES.startingStock.costs[0];
    expect(before.profile.coins).toBeGreaterThanOrEqual(cost);
    const buy = await app.inject({ method: 'POST', url: '/api/player/upgrades/purchase', headers: { cookie }, payload: { restaurantId: 'diner', upgradeType: 'startingStock' } });
    expect(buy.statusCode).toBe(200);
    expect(buy.json().newLevel).toBe(1);
    expect(buy.json().player.profile.coins).toBe(before.profile.coins - cost);
    expect(buy.json().player.restaurants[0].upgrades.startingStock).toBe(1);

    // The upgrade snapshot is applied to the next run.
    const start = await app.inject({ method: 'POST', url: '/api/game/restaurants/diner/levels/1/start', headers: { cookie } });
    expect(start.json().upgrades.startingStock).toBe(1);

    const unknown = await app.inject({ method: 'POST', url: '/api/player/upgrades/purchase', headers: { cookie }, payload: { restaurantId: 'diner', upgradeType: 'goldenSpatula' } });
    expect(unknown.statusCode).toBe(400);
    const lockedRestaurant = await app.inject({ method: 'POST', url: '/api/player/upgrades/purchase', headers: { cookie }, payload: { restaurantId: 'pizzeria', upgradeType: 'grillSpeed' } });
    expect(lockedRestaurant.statusCode).toBe(403);
  });

  it('cannot exceed the max level', async () => {
    const cookie = await registerUser('jack');
    const user = await db.user.findUnique({ where: { username: 'jack' }, include: { profile: true } });
    await db.playerProfile.update({ where: { id: user!.profile!.id }, data: { coins: 100000 } });
    for (let i = 0; i < 5; i++) {
      const r = await app.inject({ method: 'POST', url: '/api/player/upgrades/purchase', headers: { cookie }, payload: { restaurantId: 'diner', upgradeType: 'patience' } });
      expect(r.statusCode).toBe(200);
    }
    const r = await app.inject({ method: 'POST', url: '/api/player/upgrades/purchase', headers: { cookie }, payload: { restaurantId: 'diner', upgradeType: 'patience' } });
    expect(r.statusCode).toBe(409);
    const total = UPGRADES.patience.costs.reduce((a, b) => a + b, 0);
    expect(r.statusCode === 409 && (await db.playerProfile.findUnique({ where: { id: user!.profile!.id } }))!.coins).toBe(100000 - total);
  });
});

describe('settings & config', () => {
  it('persists settings', async () => {
    const cookie = await registerUser('kate');
    const settings = { audio: { master: 0.4, music: false, sfx: true, voices: false, ui: true }, showHints: false, reducedMotion: true };
    const put = await app.inject({ method: 'PUT', url: '/api/player/settings', headers: { cookie }, payload: settings });
    expect(put.statusCode).toBe(200);
    const state = (await app.inject({ method: 'GET', url: '/api/player/state', headers: { cookie } })).json() as PlayerStateDTO;
    expect(state.profile.settings).toEqual(settings);
  });

  it('serves the game config', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/config' });
    expect(res.statusCode).toBe(200);
    expect(res.json().levels.diner).toHaveLength(20);
    expect(res.json().upgradeCosts.diner.grillSpeed).toEqual(UPGRADES.grillSpeed.costs);
  });
});
