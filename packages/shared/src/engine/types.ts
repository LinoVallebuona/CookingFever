import type { CustomerTypeId } from '../config/customers';
import type { BonusObjective, LevelDef } from '../config/levels';
import type { BurgerTopping, IngredientId, MenuItemId } from '../config/menu';
import type { KitchenModifiers } from '../config/upgrades';

/** Fixed simulation rate. The engine always advances in steps of DT seconds. */
export const TICK_RATE = 60;
export const DT = 1 / TICK_RATE;

export const ENTER_TIME = 0.9;
export const LEAVE_TIME = 1.0;
/** Patience restored (as fraction of max) every time an item is served. */
export const SERVE_PATIENCE_BONUS = 0.12;
/** Fraction of order value paid as tip at full patience. */
export const BASE_TIP_RATE = 0.3;
export const COMBO_BONUS_PER_STEP = 3;
export const MAX_COMBO_BONUS_STEPS = 6;

export type GrillState = 'empty' | 'raw' | 'cooked' | 'burnt';
export type FryerState = 'empty' | 'frying' | 'done' | 'burnt';
export type CupState = 'empty' | 'filling' | 'full';
export type ShakerState = 'empty' | 'blending' | 'ready' | 'melted';

export interface GrillSlot {
  state: GrillState;
  timer: number;
}

export interface Plate {
  bun: boolean;
  patty: boolean;
  toppings: BurgerTopping[];
}

export interface FryerBasket {
  state: FryerState;
  timer: number;
  /** Portions remaining in a finished basket (when the warmer was too full). */
  portions: number;
}

export interface CupSlot {
  state: CupState;
  timer: number;
}

export interface ShakerSlot {
  state: ShakerState;
  timer: number;
}

export interface Bin {
  stock: number;
  max: number;
  /** Seconds left until restock completes, or 0 when not restocking. */
  restocking: number;
}

export interface OrderItem {
  item: MenuItemId;
  served: boolean;
}

export type CustomerPhase = 'entering' | 'waiting' | 'leaving';

export interface Customer {
  id: number;
  type: CustomerTypeId;
  seat: number;
  order: OrderItem[];
  patience: number;
  maxPatience: number;
  phase: CustomerPhase;
  phaseTimer: number;
  /** Set when leaving: whether the customer was served successfully. */
  happy: boolean;
  /** Cosmetic variation seed (skin, hair...). */
  look: number;
  /** Coins paid when leaving happily (for display). */
  paid: number;
  tip: number;
  arrivedAt: number;
}

export interface GameStats {
  revenue: number;
  sales: number;
  tips: number;
  comboBonus: number;
  served: number;
  lost: number;
  itemsServed: number;
  wasted: number;
  combo: number;
  maxCombo: number;
  lastCompleteAt: number;
  satisfactionSum: number;
  resolved: number;
}

export type GameStatus = 'running' | 'finished';

export interface GameState {
  tick: number;
  time: number;
  status: GameStatus;
  customers: Customer[];
  seats: (number | null)[];
  spawned: number;
  nextSpawnAt: number;
  grill: GrillSlot[];
  plates: Plate[];
  fryer: FryerBasket[];
  warmer: { portions: number; capacity: number };
  cups: CupSlot[];
  shakers: ShakerSlot[];
  bins: Record<IngredientId, Bin>;
  stats: GameStats;
  /** Ingredients actually used by this level's menu. */
  ingredients: IngredientId[];
}

export type DiscardStation = 'plate' | 'grill' | 'fryer' | 'cup' | 'shaker';

export type PlayerAction =
  | { type: 'bin'; bin: IngredientId; plate?: number }
  | { type: 'grill'; slot: number; plate?: number }
  | { type: 'plate'; plate: number; customer?: number }
  | { type: 'fryer'; basket: number }
  | { type: 'warmer'; customer?: number }
  | { type: 'cup'; slot: number; customer?: number }
  | { type: 'shaker'; slot: number; customer?: number }
  | { type: 'discard'; station: DiscardStation; index: number };

/** An action stamped with the tick it was applied at (before that tick's update). */
export interface RecordedAction {
  t: number;
  a: PlayerAction;
}

export type SourceRef =
  | { kind: 'plate'; index: number }
  | { kind: 'warmer'; index: number }
  | { kind: 'cup'; index: number }
  | { kind: 'shaker'; index: number }
  | { kind: 'grill'; index: number }
  | { kind: 'fryer'; index: number }
  | { kind: 'bin'; bin: IngredientId };

export type GameEvent =
  | { type: 'customerArrived'; customer: number }
  | { type: 'customerOrdered'; customer: number }
  | { type: 'customerImpatient'; customer: number }
  | { type: 'customerLeft'; customer: number; seat: number }
  | { type: 'customerPaid'; customer: number; seat: number; amount: number; tip: number; combo: number; comboBonus: number }
  | { type: 'served'; customer: number; seat: number; item: MenuItemId; source: SourceRef }
  | { type: 'placed'; source: SourceRef; ingredient: IngredientId }
  | { type: 'moved'; from: SourceRef; to: SourceRef }
  | { type: 'cooked'; source: SourceRef }
  | { type: 'burnt'; source: SourceRef }
  | { type: 'trashed'; source: SourceRef }
  | { type: 'restockStarted'; bin: IngredientId }
  | { type: 'restocked'; bin: IngredientId }
  | { type: 'invalid'; reason: string; source?: SourceRef }
  | { type: 'levelEnded' };

export interface ObjectiveResult {
  id: 'star1' | 'star2' | 'star3' | 'bonus';
  label: string;
  met: boolean;
}

export interface GameResult {
  levelNumber: number;
  restaurantId: string;
  revenue: number;
  sales: number;
  tips: number;
  comboBonus: number;
  served: number;
  lost: number;
  totalCustomers: number;
  satisfaction: number;
  maxCombo: number;
  wasted: number;
  itemsServed: number;
  stars: number;
  passed: boolean;
  objectives: ObjectiveResult[];
  ticks: number;
  seconds: number;
}

export interface EngineOptions {
  level: LevelDef;
  mods: KitchenModifiers;
  seed: number;
  /** Collect events for audio/visual feedback (client only). */
  collectEvents?: boolean;
}

export type { BonusObjective };
