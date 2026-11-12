import { LEVELS_BY_RESTAURANT, RESTAURANTS, UPGRADES, UPGRADE_TYPES } from '@sizzle/shared';
import type { Db } from '../db';

/**
 * Upserts restaurants, levels and upgrade tiers from the shared game config.
 * Idempotent – runs in the seed script and on every server start so the
 * database never lags behind the game code.
 */
export async function syncGameConfig(db: Db): Promise<{ restaurants: number; levels: number; upgrades: number }> {
  let levels = 0;
  let upgrades = 0;
  for (const r of RESTAURANTS) {
    await db.restaurant.upsert({
      where: { id: r.id },
      create: { id: r.id, name: r.name, description: r.description, unlockRequirement: r.unlockRequirement, playable: r.playable, sortOrder: r.sortOrder },
      update: { name: r.name, description: r.description, unlockRequirement: r.unlockRequirement, playable: r.playable, sortOrder: r.sortOrder },
    });
    for (const l of LEVELS_BY_RESTAURANT[r.id] ?? []) {
      const data = {
        name: l.name,
        revenueTarget: l.targets[0],
        targetTwoStar: l.targets[1],
        targetThreeStar: l.targets[2],
        duration: l.duration,
        difficulty: l.difficulty,
        customers: l.customers,
        config: JSON.parse(JSON.stringify(l)),
      };
      await db.level.upsert({
        where: { restaurantId_levelNumber: { restaurantId: r.id, levelNumber: l.number } },
        create: { restaurantId: r.id, levelNumber: l.number, ...data },
        update: data,
      });
      levels++;
    }
    if (!r.playable) continue;
    for (const type of UPGRADE_TYPES) {
      const def = UPGRADES[type];
      for (let i = 0; i < def.costs.length; i++) {
        const level = i + 1;
        await db.restaurantUpgrade.upsert({
          where: { restaurantId_upgradeType_level: { restaurantId: r.id, upgradeType: type, level } },
          create: { restaurantId: r.id, upgradeType: type, level, cost: def.costs[i], description: def.levelEffects[level] },
          update: { cost: def.costs[i], description: def.levelEffects[level] },
        });
        upgrades++;
      }
    }
  }
  return { restaurants: RESTAURANTS.length, levels, upgrades };
}
