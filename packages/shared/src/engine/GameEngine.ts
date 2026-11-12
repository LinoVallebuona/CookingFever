import type { LevelDef } from '../config/levels';
import { INGREDIENTS, MENU, type IngredientId } from '../config/menu';
import { computeKitchenModifiers, type KitchenModifiers, type UpgradeLevels } from '../config/upgrades';
import { Rng } from '../rng';
import type { EngineContext } from './context';
import { loseCustomer, updateCustomers, updateSpawning } from './customers';
import { applyAction, updateKitchen } from './kitchen';
import { buildResult } from './scoring';
import {
  DT,
  type EngineOptions,
  type GameEvent,
  type GameResult,
  type GameState,
  type PlayerAction,
  type RecordedAction,
} from './types';

/** Ingredients needed by a level menu (determines which bins are shown/usable). */
export function ingredientsForMenu(level: LevelDef): IngredientId[] {
  const set = new Set<IngredientId>();
  for (const id of level.menu) for (const ing of MENU[id].ingredients) set.add(ing);
  return (Object.keys(INGREDIENTS) as IngredientId[]).filter((i) => set.has(i));
}

export function createInitialState(level: LevelDef, mods: KitchenModifiers): GameState {
  const ingredients = ingredientsForMenu(level);
  const bins = {} as GameState['bins'];
  for (const id of Object.keys(INGREDIENTS) as IngredientId[]) {
    const max = mods.binStock[id];
    bins[id] = { stock: max, max, restocking: 0 };
  }
  return {
    tick: 0,
    time: 0,
    status: 'running',
    customers: [],
    seats: Array.from({ length: level.seats }, () => null),
    spawned: 0,
    nextSpawnAt: level.firstSpawnDelay,
    grill: Array.from({ length: mods.grillSlots }, () => ({ state: 'empty' as const, timer: 0 })),
    plates: Array.from({ length: mods.plates }, () => ({ bun: false, patty: false, toppings: [] })),
    fryer: Array.from({ length: mods.fryerBaskets }, () => ({ state: 'empty' as const, timer: 0, portions: 0 })),
    warmer: { portions: 0, capacity: mods.warmerCapacity },
    cups: Array.from({ length: mods.cupSlots }, () => ({ state: 'empty' as const, timer: 0 })),
    shakers: Array.from({ length: mods.shakerSlots }, () => ({ state: 'empty' as const, timer: 0 })),
    bins,
    stats: {
      revenue: 0,
      sales: 0,
      tips: 0,
      comboBonus: 0,
      served: 0,
      lost: 0,
      itemsServed: 0,
      wasted: 0,
      combo: 0,
      maxCombo: 0,
      lastCompleteAt: -1,
      satisfactionSum: 0,
      resolved: 0,
    },
    ingredients,
  };
}

/**
 * Deterministic, UI-independent restaurant simulation.
 *
 * - Time only advances through `step()` in fixed increments of DT.
 * - Player input goes through `dispatch()`, which records the action with the
 *   current tick so the run can be replayed exactly (server-side validation).
 */
export class GameEngine {
  readonly level: LevelDef;
  readonly mods: KitchenModifiers;
  readonly seed: number;
  readonly state: GameState;
  readonly actions: RecordedAction[] = [];
  private readonly ctx: EngineContext;
  private events: GameEvent[] = [];
  private readonly collectEvents: boolean;

  constructor(opts: EngineOptions) {
    this.level = opts.level;
    this.mods = opts.mods;
    this.seed = opts.seed >>> 0;
    this.collectEvents = opts.collectEvents ?? false;
    this.state = createInitialState(this.level, this.mods);
    this.ctx = {
      state: this.state,
      level: this.level,
      mods: this.mods,
      rng: new Rng(this.seed),
      emit: (e) => {
        if (this.collectEvents) this.events.push(e);
      },
    };
  }

  static create(level: LevelDef, upgrades: Partial<UpgradeLevels>, seed: number, collectEvents = false): GameEngine {
    return new GameEngine({ level, mods: computeKitchenModifiers(upgrades), seed, collectEvents });
  }

  get finished(): boolean {
    return this.state.status === 'finished';
  }

  get timeLeft(): number {
    return Math.max(0, this.level.duration - this.state.time);
  }

  /** Applies a player action at the current tick. */
  dispatch(action: PlayerAction): boolean {
    if (this.finished) return false;
    this.actions.push({ t: this.state.tick, a: JSON.parse(JSON.stringify(action)) });
    return applyAction(this.ctx, action);
  }

  /** Advances the simulation by exactly one tick. */
  step(): void {
    if (this.finished) return;
    const s = this.state;
    s.tick++;
    s.time = s.tick * DT;
    updateKitchen(this.ctx);
    updateCustomers(this.ctx);
    updateSpawning(this.ctx);
    this.checkEnd();
  }

  private checkEnd(): void {
    const s = this.state;
    const allDone = s.spawned >= this.level.customers && s.customers.length === 0;
    const timeUp = s.time >= this.level.duration - 1e-9;
    if (!allDone && !timeUp) return;
    if (timeUp) {
      for (const c of s.customers) if (c.phase !== 'leaving') loseCustomer(this.ctx, c);
    }
    s.status = 'finished';
    this.ctx.emit({ type: 'levelEnded' });
  }

  drainEvents(): GameEvent[] {
    const e = this.events;
    this.events = [];
    return e;
  }

  result(): GameResult {
    return buildResult(this.level, this.state);
  }
}
