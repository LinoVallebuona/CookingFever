import { UPGRADE_TYPES, type PurchaseUpgradeResponse, type UpgradeType } from '@sizzle/shared';
import type { Db } from '../db';
import { badRequest, conflict, forbidden, notFound } from '../lib/errors';
import { ensureProfile, getPlayerState } from './playerService';

/** Buys the next level of an upgrade. Price comes from the database, never the client. */
export async function purchaseUpgrade(db: Db, userId: string, restaurantId: string, upgradeType: string): Promise<PurchaseUpgradeResponse> {
  if (!(UPGRADE_TYPES as string[]).includes(upgradeType)) throw badRequest('Unknown upgrade type');
  const profile = await ensureProfile(db, userId);
  const restaurant = await db.restaurant.findUnique({ where: { id: restaurantId } });
  if (!restaurant) throw notFound('Restaurant not found');
  const owned = await db.playerRestaurant.findUnique({ where: { playerId_restaurantId: { playerId: profile.id, restaurantId } } });
  if (!restaurant.playable || !owned) throw forbidden('Restaurant is locked');

  const result = await db.$transaction(async (tx) => {
    const current = await tx.playerUpgrade.findUnique({
      where: { playerId_restaurantId_upgradeType: { playerId: profile.id, restaurantId, upgradeType } },
    });
    const currentLevel = current?.currentLevel ?? 0;
    const tier = await tx.restaurantUpgrade.findUnique({
      where: { restaurantId_upgradeType_level: { restaurantId, upgradeType, level: currentLevel + 1 } },
    });
    if (!tier) throw conflict('This upgrade is already at its maximum level');

    // Atomic "spend if affordable".
    const spent = await tx.playerProfile.updateMany({ where: { id: profile.id, coins: { gte: tier.cost } }, data: { coins: { decrement: tier.cost } } });
    if (spent.count !== 1) throw badRequest(`Not enough coins – you need ${tier.cost}`);

    if (current) {
      const bumped = await tx.playerUpgrade.updateMany({ where: { id: current.id, currentLevel }, data: { currentLevel: currentLevel + 1 } });
      if (bumped.count !== 1) throw conflict('Upgrade changed concurrently, please retry');
    } else {
      await tx.playerUpgrade.create({ data: { playerId: profile.id, restaurantId, upgradeType, currentLevel: 1 } });
    }
    return { newLevel: currentLevel + 1, cost: tier.cost };
  });

  return { upgradeType: upgradeType as UpgradeType, ...result, player: await getPlayerState(db, userId) };
}
