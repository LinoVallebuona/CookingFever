import { CUSTOMER_TYPES } from '../config/customers';
import { describeObjective, type LevelDef } from '../config/levels';
import type { MenuItemId } from '../config/menu';
import type { EngineContext } from './context';
import { orderValue } from './orders';
import {
  BASE_TIP_RATE,
  COMBO_BONUS_PER_STEP,
  MAX_COMBO_BONUS_STEPS,
  SERVE_PATIENCE_BONUS,
  type Customer,
  type GameResult,
  type GameState,
  type ObjectiveResult,
  type SourceRef,
} from './types';

/** Finds the customer who should receive `item` (explicit target or longest waiting). */
export function findRecipient(state: GameState, item: MenuItemId, customerId?: number): Customer | null {
  if (customerId !== undefined) {
    const c = state.customers.find((x) => x.id === customerId);
    if (!c || c.phase !== 'waiting') return null;
    return c.order.some((o) => !o.served && o.item === item) ? c : null;
  }
  let best: Customer | null = null;
  for (const c of state.customers) {
    if (c.phase !== 'waiting') continue;
    if (!c.order.some((o) => !o.served && o.item === item)) continue;
    if (!best || c.arrivedAt < best.arrivedAt || (c.arrivedAt === best.arrivedAt && c.id < best.id)) best = c;
  }
  return best;
}

/** Hands an item to a customer. Returns false (and emits feedback) if nobody wants it. */
export function serveItem(ctx: EngineContext, item: MenuItemId, source: SourceRef, customerId?: number): boolean {
  const c = findRecipient(ctx.state, item, customerId);
  if (!c) {
    ctx.emit({ type: 'invalid', reason: customerId !== undefined ? "That's not what they ordered" : 'Nobody ordered that', source });
    return false;
  }
  const entry = c.order.find((o) => !o.served && o.item === item)!;
  entry.served = true;
  ctx.state.stats.itemsServed++;
  c.patience = Math.min(c.maxPatience, c.patience + c.maxPatience * SERVE_PATIENCE_BONUS);
  ctx.emit({ type: 'served', customer: c.id, seat: c.seat, item, source });
  if (c.order.every((o) => o.served)) completeCustomer(ctx, c);
  return true;
}

function completeCustomer(ctx: EngineContext, c: Customer): void {
  const { state, mods } = ctx;
  const stats = state.stats;
  const ratio = Math.max(0, Math.min(1, c.patience / c.maxPatience));
  const value = orderValue(c.order, mods.priceMult);
  const tip = Math.round(value * BASE_TIP_RATE * ratio * CUSTOMER_TYPES[c.type].tipMult * mods.tipMult);

  if (stats.lastCompleteAt >= 0 && state.time - stats.lastCompleteAt <= mods.comboWindow && stats.combo > 0) {
    stats.combo++;
  } else {
    stats.combo = 1;
  }
  stats.lastCompleteAt = state.time;
  stats.maxCombo = Math.max(stats.maxCombo, stats.combo);
  const comboBonus = Math.min(stats.combo - 1, MAX_COMBO_BONUS_STEPS) * COMBO_BONUS_PER_STEP;

  stats.sales += value;
  stats.tips += tip;
  stats.comboBonus += comboBonus;
  stats.revenue += value + tip + comboBonus;
  stats.served++;
  stats.resolved++;
  stats.satisfactionSum += 0.6 + 0.4 * ratio;

  c.phase = 'leaving';
  c.phaseTimer = 0;
  c.happy = true;
  c.paid = value + comboBonus;
  c.tip = tip;
  ctx.emit({ type: 'customerPaid', customer: c.id, seat: c.seat, amount: value, tip, combo: stats.combo, comboBonus });
}

export function satisfactionPercent(state: GameState): number {
  if (state.stats.resolved === 0) return 100;
  return Math.round((100 * state.stats.satisfactionSum) / state.stats.resolved);
}

export function isBonusObjectiveMet(level: LevelDef, state: GameState): boolean {
  const o = level.bonusObjective;
  const s = state.stats;
  switch (o.type) {
    case 'maxLost':
      return s.lost <= o.value;
    case 'minSatisfaction':
      return satisfactionPercent(state) >= o.value;
    case 'minCombo':
      return s.maxCombo >= o.value;
    case 'minServed':
      return s.served >= o.value;
  }
}

export function computeStars(level: LevelDef, revenue: number, bonusMet: boolean): number {
  const [t1, t2, t3] = level.targets;
  if (revenue < t1) return 0;
  let stars = 1;
  if (revenue >= t2) stars = 2;
  if (revenue >= t3 && bonusMet) stars = 3;
  return stars;
}

export function buildResult(level: LevelDef, state: GameState): GameResult {
  const s = state.stats;
  const bonusMet = isBonusObjectiveMet(level, state);
  const stars = computeStars(level, s.revenue, bonusMet);
  const [t1, t2, t3] = level.targets;
  const objectives: ObjectiveResult[] = [
    { id: 'star1', label: `Earn ${t1} coins`, met: s.revenue >= t1 },
    { id: 'star2', label: `Earn ${t2} coins`, met: s.revenue >= t2 },
    { id: 'star3', label: `Earn ${t3} coins`, met: s.revenue >= t3 },
    { id: 'bonus', label: describeObjective(level.bonusObjective), met: bonusMet },
  ];
  return {
    levelNumber: level.number,
    restaurantId: level.restaurantId,
    revenue: s.revenue,
    sales: s.sales,
    tips: s.tips,
    comboBonus: s.comboBonus,
    served: s.served,
    lost: s.lost,
    totalCustomers: s.resolved,
    satisfaction: satisfactionPercent(state),
    maxCombo: s.maxCombo,
    wasted: s.wasted,
    itemsServed: s.itemsServed,
    stars,
    passed: stars > 0,
    objectives,
    ticks: state.tick,
    seconds: Math.round(state.time * 10) / 10,
  };
}
