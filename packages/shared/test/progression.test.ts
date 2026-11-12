import { describe, expect, it } from 'vitest';
import {
  DINER_LEVELS,
  GameEngine,
  GamePhase,
  MENU,
  UPGRADES,
  UPGRADE_TYPES,
  canTransition,
  computeLevelReward,
  computeStars,
  emptyUpgradeLevels,
  nextUpgradeCost,
} from '../src';
import { playWithBot } from '../src/bot';

describe('Level definitions', () => {
  it('has 20 diner levels with valid, increasing targets', () => {
    expect(DINER_LEVELS).toHaveLength(20);
    DINER_LEVELS.forEach((l, i) => {
      expect(l.number).toBe(i + 1);
      expect(l.targets[0]).toBeLessThan(l.targets[1]);
      expect(l.targets[1]).toBeLessThan(l.targets[2]);
      for (const m of l.menu) expect(MENU[m]).toBeDefined();
      // all customers can arrive well before the shift ends
      const worstArrival = l.firstSpawnDelay + (l.customers - 1) * l.spawnInterval[1];
      expect(worstArrival).toBeLessThan(l.duration * 0.85);
    });
  });

  it('every level is winnable by a quick player with no upgrades', () => {
    for (const level of DINER_LEVELS) {
      let stars = 0;
      for (let seed = 1; seed <= 3; seed++) {
        const e = GameEngine.create(level, emptyUpgradeLevels(), seed * 101);
        playWithBot(e, 24);
        stars += e.result().stars;
      }
      expect(stars / 3, `level ${level.number}`).toBeGreaterThanOrEqual(2);
    }
  });

  it('every level can be passed by a slower player with upgrades', () => {
    const maxed = Object.fromEntries(UPGRADE_TYPES.map((t) => [t, 3]));
    for (const level of DINER_LEVELS) {
      const e = GameEngine.create(level, maxed, 999);
      playWithBot(e, 50);
      expect(e.result().passed, `level ${level.number}`).toBe(true);
    }
  });
});

describe('Stars', () => {
  const level = DINER_LEVELS[4];
  it('awards stars by revenue thresholds', () => {
    expect(computeStars(level, level.targets[0] - 1, true)).toBe(0);
    expect(computeStars(level, level.targets[0], true)).toBe(1);
    expect(computeStars(level, level.targets[1], true)).toBe(2);
    expect(computeStars(level, level.targets[2], true)).toBe(3);
  });
  it('requires the bonus objective for the third star', () => {
    expect(computeStars(level, level.targets[2] + 100, false)).toBe(2);
  });
});

describe('Upgrades', () => {
  it('have strictly increasing costs and five levels', () => {
    for (const t of UPGRADE_TYPES) {
      const costs = UPGRADES[t].costs;
      expect(costs).toHaveLength(5);
      for (let i = 1; i < costs.length; i++) expect(costs[i]).toBeGreaterThan(costs[i - 1]);
      expect(UPGRADES[t].levelEffects).toHaveLength(6);
    }
  });
  it('report next cost and null when maxed', () => {
    expect(nextUpgradeCost('grillSpeed', 0)).toBe(UPGRADES.grillSpeed.costs[0]);
    expect(nextUpgradeCost('grillSpeed', 5)).toBeNull();
  });
});

describe('Rewards', () => {
  const level = DINER_LEVELS[0];
  const base = {
    levelNumber: 1, restaurantId: 'diner', sales: 50, tips: 10, comboBonus: 0, served: 6, lost: 0, totalCustomers: 6,
    satisfaction: 90, maxCombo: 2, wasted: 0, itemsServed: 9, objectives: [], ticks: 100, seconds: 10,
  };
  it('pays level coins + first clear + star improvement', () => {
    const r = computeLevelReward({ level, result: { ...base, revenue: 60, stars: 2, passed: true }, previousBestStars: 0, previouslyCompleted: false });
    expect(r.levelCoins).toBe(60);
    expect(r.firstClearBonus).toBe(level.firstClearReward);
    expect(r.starBonus).toBe(50);
    expect(r.total).toBe(60 + level.firstClearReward + 50);
  });
  it('does not repeat first-clear or star bonuses', () => {
    const r = computeLevelReward({ level, result: { ...base, revenue: 60, stars: 2, passed: true }, previousBestStars: 3, previouslyCompleted: true });
    expect(r.total).toBe(60);
    expect(r.newBestStars).toBe(3);
  });
  it('still pays earned coins on a failed attempt', () => {
    const r = computeLevelReward({ level, result: { ...base, revenue: 20, stars: 0, passed: false }, previousBestStars: 0, previouslyCompleted: false });
    expect(r.total).toBe(20);
  });
});

describe('Game phases', () => {
  it('allows only valid transitions', () => {
    expect(canTransition(GamePhase.PLAYING, GamePhase.PAUSED)).toBe(true);
    expect(canTransition(GamePhase.PAUSED, GamePhase.PLAYING)).toBe(true);
    expect(canTransition(GamePhase.MENU, GamePhase.LEVEL_COMPLETED)).toBe(false);
    expect(canTransition(GamePhase.LEVEL_FAILED, GamePhase.PLAYING)).toBe(true);
  });
});
