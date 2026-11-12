import type { LevelDef } from './config/levels';
import type { GameResult } from './engine/types';

export const STAR_IMPROVEMENT_BONUS = 25;

export interface LevelRewardInput {
  level: LevelDef;
  result: GameResult;
  previousBestStars: number;
  previouslyCompleted: boolean;
}

export interface LevelReward {
  /** Coins earned inside the level (sales + tips + combo bonus). */
  levelCoins: number;
  /** Bonus for passing the level for the first time. */
  firstClearBonus: number;
  /** Bonus for beating the previous star record. */
  starBonus: number;
  total: number;
  newBestStars: number;
}

/**
 * Coins a player earns for a finished level. Computed on the server from a
 * replayed result, never from client-submitted numbers.
 */
export function computeLevelReward({ level, result, previousBestStars, previouslyCompleted }: LevelRewardInput): LevelReward {
  const levelCoins = Math.max(0, Math.floor(result.revenue));
  const firstClearBonus = result.passed && !previouslyCompleted ? level.firstClearReward : 0;
  const newBestStars = Math.max(previousBestStars, result.stars);
  const starBonus = (newBestStars - previousBestStars) * STAR_IMPROVEMENT_BONUS;
  return { levelCoins, firstClearBonus, starBonus, total: levelCoins + firstClearBonus + starBonus, newBestStars };
}
