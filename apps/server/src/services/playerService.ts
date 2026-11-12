import {
  DEFAULT_SETTINGS,
  RESTAURANTS,
  emptyUpgradeLevels,
  type LevelProgressDTO,
  type PlayerSettings,
  type PlayerStateDTO,
  type RestaurantProgressDTO,
  type UpgradeLevels,
  type UpgradeType,
  UPGRADE_TYPES,
} from '@sizzle/shared';
import type { Db } from '../db';
import { notFound } from '../lib/errors';

/** Creates the profile (and unlocks starter restaurants) if it does not exist yet. */
export async function ensureProfile(db: Db, userId: string) {
  const existing = await db.playerProfile.findUnique({ where: { userId } });
  if (existing) return existing;
  const starters = await db.restaurant.findMany({ where: { unlockRequirement: 0, playable: true } });
  return db.playerProfile.create({
    data: {
      userId,
      settings: DEFAULT_SETTINGS as object,
      restaurants: { create: starters.map((r) => ({ restaurantId: r.id })) },
    },
  });
}

export function mergeSettings(raw: unknown): PlayerSettings {
  const s = (raw ?? {}) as Partial<PlayerSettings>;
  return {
    ...DEFAULT_SETTINGS,
    ...s,
    audio: { ...DEFAULT_SETTINGS.audio, ...(s.audio ?? {}) },
  };
}

export async function getUpgradeLevels(db: Db, playerId: string, restaurantId: string): Promise<UpgradeLevels> {
  const rows = await db.playerUpgrade.findMany({ where: { playerId, restaurantId } });
  const levels = emptyUpgradeLevels();
  for (const r of rows) {
    if ((UPGRADE_TYPES as string[]).includes(r.upgradeType)) levels[r.upgradeType as UpgradeType] = r.currentLevel;
  }
  return levels;
}

/** Re-computes the cached totals on the profile from the progress rows. */
export async function recomputeTotals(db: Pick<Db, 'playerLevelProgress' | 'playerProfile'>, playerId: string) {
  const rows = await db.playerLevelProgress.findMany({ where: { playerId } });
  const totalStars = rows.reduce((s, r) => s + r.bestStars, 0);
  const totalLevelsCompleted = rows.filter((r) => r.completed).length;
  await db.playerProfile.update({ where: { id: playerId }, data: { totalStars, totalLevelsCompleted } });
}

/** Builds the full player state returned to the client. */
export async function getPlayerState(db: Db, userId: string): Promise<PlayerStateDTO> {
  await ensureProfile(db, userId);
  const user = await db.user.findUnique({
    where: { id: userId },
    include: {
      profile: {
        include: {
          restaurants: true,
          levelProgress: { include: { level: true } },
          upgrades: true,
        },
      },
    },
  });
  if (!user || !user.profile) throw notFound('Player not found');
  const profile = user.profile;
  const restaurantsDb = await db.restaurant.findMany({ orderBy: { sortOrder: 'asc' }, include: { levels: { orderBy: { levelNumber: 'asc' } } } });

  const restaurants: RestaurantProgressDTO[] = restaurantsDb.map((r) => {
    const def = RESTAURANTS.find((x) => x.id === r.id);
    const unlocked = r.playable && profile.restaurants.some((pr) => pr.restaurantId === r.id);
    const progressByLevel = new Map(profile.levelProgress.filter((p) => p.level.restaurantId === r.id).map((p) => [p.level.levelNumber, p]));
    const levels: LevelProgressDTO[] = r.levels.map((l) => {
      const p = progressByLevel.get(l.levelNumber);
      const prev = progressByLevel.get(l.levelNumber - 1);
      return {
        levelNumber: l.levelNumber,
        bestStars: p?.bestStars ?? 0,
        bestRevenue: p?.bestRevenue ?? 0,
        completed: p?.completed ?? false,
        attempts: p?.attempts ?? 0,
        unlocked: unlocked && (l.levelNumber === 1 || !!prev?.completed),
      };
    });
    const upgrades = emptyUpgradeLevels();
    for (const u of profile.upgrades) {
      if (u.restaurantId === r.id && (UPGRADE_TYPES as string[]).includes(u.upgradeType)) upgrades[u.upgradeType as UpgradeType] = u.currentLevel;
    }
    return {
      restaurant: def ?? {
        id: r.id,
        name: r.name,
        description: r.description,
        unlockRequirement: r.unlockRequirement,
        playable: r.playable,
        theme: { primary: '#888', secondary: '#ccc', emoji: '🍽️' },
        sortOrder: r.sortOrder,
      },
      unlocked,
      levels,
      upgrades,
      stars: levels.reduce((s, l) => s + l.bestStars, 0),
    };
  });

  return {
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      isGuest: user.isGuest,
      createdAt: user.createdAt.toISOString(),
    },
    profile: {
      coins: profile.coins,
      totalStars: profile.totalStars,
      totalLevelsCompleted: profile.totalLevelsCompleted,
      stats: {
        totalCoinsEarned: profile.totalCoinsEarned,
        totalCustomersServed: profile.totalCustomersServed,
        totalCustomersLost: profile.totalCustomersLost,
        totalGamesPlayed: profile.totalGamesPlayed,
        bestCombo: profile.bestCombo,
      },
      settings: mergeSettings(profile.settings),
    },
    restaurants,
  };
}
