import {
  computeLevelReward,
  replayGame,
  type CompleteLevelResponse,
  type LevelDef,
  type RecordedAction,
  type StartLevelResponse,
  type UpgradeLevels,
} from '@sizzle/shared';
import type { FastifyBaseLogger } from 'fastify';
import type { Db } from '../db';
import { randomSeed } from '../lib/crypto';
import { conflict, forbidden, notFound, unprocessable } from '../lib/errors';
import { ensureProfile, getPlayerState, getUpgradeLevels, recomputeTotals } from './playerService';

export async function startLevel(db: Db, userId: string, restaurantId: string, levelNumber: number): Promise<StartLevelResponse> {
  const profile = await ensureProfile(db, userId);
  const restaurant = await db.restaurant.findUnique({ where: { id: restaurantId } });
  if (!restaurant) throw notFound('Restaurant not found');
  if (!restaurant.playable) throw forbidden('This restaurant is not available yet');
  const owned = await db.playerRestaurant.findUnique({ where: { playerId_restaurantId: { playerId: profile.id, restaurantId } } });
  if (!owned) throw forbidden('Restaurant is locked');

  const level = await db.level.findUnique({ where: { restaurantId_levelNumber: { restaurantId, levelNumber } } });
  if (!level) throw notFound('Level not found');
  if (levelNumber > 1) {
    const prev = await db.level.findUnique({ where: { restaurantId_levelNumber: { restaurantId, levelNumber: levelNumber - 1 } } });
    const prevProgress = prev && (await db.playerLevelProgress.findUnique({ where: { playerId_levelId: { playerId: profile.id, levelId: prev.id } } }));
    if (!prevProgress?.completed) throw forbidden(`Complete level ${levelNumber - 1} first`);
  }

  const upgrades = await getUpgradeLevels(db, profile.id, restaurantId);
  const seed = randomSeed();

  const session = await db.$transaction(async (tx) => {
    // Only one active run per player – older unfinished runs are abandoned.
    await tx.gameSession.updateMany({ where: { playerId: profile.id, status: 'ACTIVE' }, data: { status: 'ABANDONED', finishedAt: new Date() } });
    await tx.playerLevelProgress.upsert({
      where: { playerId_levelId: { playerId: profile.id, levelId: level.id } },
      create: { playerId: profile.id, levelId: level.id, attempts: 1 },
      update: { attempts: { increment: 1 } },
    });
    return tx.gameSession.create({
      data: { playerId: profile.id, levelId: level.id, seed: BigInt(seed), upgradesSnapshot: upgrades },
    });
  });

  return { sessionId: session.id, seed, level: level.config as unknown as LevelDef, upgrades };
}

export interface CompleteOptions {
  minRealtimeFactor: number;
  log: FastifyBaseLogger;
}

export async function completeLevel(
  db: Db,
  userId: string,
  sessionId: string,
  actions: RecordedAction[],
  clientResult: { revenue: number; stars: number } | undefined,
  opts: CompleteOptions,
): Promise<CompleteLevelResponse> {
  const profile = await ensureProfile(db, userId);
  const session = await db.gameSession.findUnique({ where: { id: sessionId }, include: { level: true } });
  if (!session || session.playerId !== profile.id) throw notFound('Game session not found');
  if (session.status !== 'ACTIVE') throw conflict('This game session has already been submitted');

  const level = session.level.config as unknown as LevelDef;
  const upgrades = session.upgradesSnapshot as unknown as UpgradeLevels;
  const replay = replayGame(level, upgrades, Number(session.seed), actions);

  const reject = async (reason: string) => {
    await db.gameSession.updateMany({ where: { id: session.id, status: 'ACTIVE' }, data: { status: 'REJECTED', rejectReason: reason, finishedAt: new Date() } });
    opts.log.warn({ sessionId, reason }, 'rejected game result');
    throw unprocessable(`Result rejected: ${reason}`);
  };

  if (!replay.ok || !replay.result) return reject(replay.error ?? 'invalid replay');
  const result = replay.result;

  // The simulation cannot have run faster than real time (allowing for jitter).
  const elapsed = (Date.now() - session.startedAt.getTime()) / 1000;
  if (elapsed + 3 < result.seconds * opts.minRealtimeFactor) return reject('finished faster than possible');

  if (clientResult && (clientResult.revenue !== result.revenue || clientResult.stars !== result.stars)) {
    opts.log.warn({ sessionId, clientResult, server: { revenue: result.revenue, stars: result.stars } }, 'client/server result mismatch');
  }

  const progress = await db.playerLevelProgress.findUnique({ where: { playerId_levelId: { playerId: profile.id, levelId: session.levelId } } });
  const reward = computeLevelReward({
    level,
    result,
    previousBestStars: progress?.bestStars ?? 0,
    previouslyCompleted: progress?.completed ?? false,
  });

  await db.$transaction(async (tx) => {
    // Conditional update guards against double submission.
    const claimed = await tx.gameSession.updateMany({
      where: { id: session.id, status: 'ACTIVE' },
      data: {
        status: result.passed ? 'COMPLETED' : 'FAILED',
        finishedAt: new Date(),
        revenue: result.revenue,
        stars: result.stars,
        coinsAwarded: reward.total,
        result: JSON.parse(JSON.stringify(result)),
      },
    });
    if (claimed.count !== 1) throw conflict('This game session has already been submitted');

    await tx.playerLevelProgress.upsert({
      where: { playerId_levelId: { playerId: profile.id, levelId: session.levelId } },
      create: {
        playerId: profile.id,
        levelId: session.levelId,
        bestStars: reward.newBestStars,
        bestRevenue: result.revenue,
        completed: result.passed,
        attempts: 1,
      },
      update: {
        bestStars: reward.newBestStars,
        bestRevenue: Math.max(progress?.bestRevenue ?? 0, result.revenue),
        completed: (progress?.completed ?? false) || result.passed,
      },
    });

    await tx.playerProfile.update({
      where: { id: profile.id },
      data: {
        coins: { increment: reward.total },
        totalCoinsEarned: { increment: reward.total },
        totalCustomersServed: { increment: result.served },
        totalCustomersLost: { increment: result.lost },
        totalGamesPlayed: { increment: 1 },
        bestCombo: Math.max(profile.bestCombo, result.maxCombo),
      },
    });
    await recomputeTotals(tx, profile.id);
  });

  const newlyUnlockedLevel =
    result.passed && !progress?.completed
      ? ((await db.level.findUnique({
          where: { restaurantId_levelNumber: { restaurantId: session.level.restaurantId, levelNumber: session.level.levelNumber + 1 } },
        }))?.levelNumber ?? null)
      : null;

  return { result, reward, newlyUnlockedLevel, player: await getPlayerState(db, userId) };
}
