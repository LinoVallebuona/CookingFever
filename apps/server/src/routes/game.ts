import {
  LEVELS_BY_RESTAURANT,
  RESTAURANTS,
  UPGRADES,
  UPGRADE_TYPES,
  type GameConfigDTO,
  type UpgradeType,
} from '@sizzle/shared';
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { completeLevel, startLevel } from '../services/gameService';
import { getPlayerState } from '../services/playerService';
import { purchaseUpgrade } from '../services/upgradeService';
import { CompleteLevelSchema, PurchaseSchema, SettingsSchema, StartLevelParams } from './schemas';

export async function configRoutes(app: FastifyInstance) {
  /** Public game configuration (restaurants, levels, upgrade prices from the DB). */
  app.get('/', async (): Promise<GameConfigDTO> => {
    const tiers = await app.db.restaurantUpgrade.findMany({ orderBy: [{ upgradeType: 'asc' }, { level: 'asc' }] });
    const upgradeCosts: GameConfigDTO['upgradeCosts'] = {};
    for (const r of RESTAURANTS) {
      if (!r.playable) continue;
      const costs = {} as Record<UpgradeType, number[]>;
      for (const t of UPGRADE_TYPES) costs[t] = tiers.filter((x) => x.restaurantId === r.id && x.upgradeType === t).map((x) => x.cost);
      upgradeCosts[r.id] = costs;
    }
    return { restaurants: RESTAURANTS, levels: LEVELS_BY_RESTAURANT, upgradeCosts };
  });

  app.get('/upgrades', async () => UPGRADES);
}

export async function playerRoutes(app: FastifyInstance) {
  app.addHook('preHandler', app.requireAuth);

  app.get('/state', async (req) => getPlayerState(app.db, req.auth!.id));

  app.put('/settings', async (req) => {
    const settings = SettingsSchema.parse(req.body);
    const profile = await app.db.playerProfile.update({ where: { userId: req.auth!.id }, data: { settings } });
    return profile.settings;
  });

  app.post('/upgrades/purchase', async (req) => {
    const body = PurchaseSchema.parse(req.body);
    return purchaseUpgrade(app.db, req.auth!.id, body.restaurantId, body.upgradeType);
  });

  app.get('/history', async (req) => {
    const q = z.object({ limit: z.coerce.number().int().min(1).max(50).default(10) }).parse(req.query);
    const profile = await app.db.playerProfile.findUnique({ where: { userId: req.auth!.id } });
    if (!profile) return [];
    const sessions = await app.db.gameSession.findMany({
      where: { playerId: profile.id, status: { in: ['COMPLETED', 'FAILED'] } },
      orderBy: { finishedAt: 'desc' },
      take: q.limit,
      include: { level: true },
    });
    return sessions.map((s) => ({
      id: s.id,
      restaurantId: s.level.restaurantId,
      levelNumber: s.level.levelNumber,
      levelName: s.level.name,
      status: s.status,
      revenue: s.revenue,
      stars: s.stars,
      coinsAwarded: s.coinsAwarded,
      finishedAt: s.finishedAt,
    }));
  });
}

export async function sessionRoutes(app: FastifyInstance) {
  app.addHook('preHandler', app.requireAuth);

  app.post('/restaurants/:restaurantId/levels/:levelNumber/start', async (req) => {
    const p = StartLevelParams.parse(req.params);
    return startLevel(app.db, req.auth!.id, p.restaurantId, p.levelNumber);
  });

  app.post('/sessions/:sessionId/complete', { bodyLimit: 2 * 1024 * 1024 }, async (req) => {
    const { sessionId } = z.object({ sessionId: z.string().min(1).max(64) }).parse(req.params);
    const body = CompleteLevelSchema.parse(req.body);
    return completeLevel(app.db, req.auth!.id, sessionId, body.actions, body.clientResult, {
      minRealtimeFactor: app.env.MIN_REALTIME_FACTOR,
      log: req.log,
    });
  });
}
