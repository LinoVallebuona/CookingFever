import { INGREDIENTS, type IngredientId } from './menu';

export type UpgradeType =
  | 'grillSpeed'
  | 'fryerSpeed'
  | 'capacity'
  | 'foodQuality'
  | 'patience'
  | 'startingStock'
  | 'servingEfficiency';

export const UPGRADE_TYPES: UpgradeType[] = [
  'grillSpeed',
  'fryerSpeed',
  'capacity',
  'foodQuality',
  'patience',
  'startingStock',
  'servingEfficiency',
];

export interface UpgradeDef {
  type: UpgradeType;
  name: string;
  description: string;
  /** Human readable effect per level (index = level, 0 = not purchased). */
  levelEffects: string[];
  /** Cost to reach level i+1 (costs[0] buys level 1). */
  costs: number[];
}

export const UPGRADES: Record<UpgradeType, UpgradeDef> = {
  grillSpeed: {
    type: 'grillSpeed',
    name: 'Turbo Grill',
    description: 'Patties cook faster and stay juicy longer before burning.',
    levelEffects: ['Standard grill', '-10% cook time', '-20% cook time', '-30% cook time', '-38% cook time', '-45% cook time'],
    costs: [80, 200, 400, 750, 1200],
  },
  fryerSpeed: {
    type: 'fryerSpeed',
    name: 'Power Fryer',
    description: 'Fries crisp up faster and burn slower.',
    levelEffects: ['Standard fryer', '-10% fry time', '-20% fry time', '-30% fry time', '-38% fry time', '-45% fry time'],
    costs: [80, 200, 400, 750, 1200],
  },
  capacity: {
    type: 'capacity',
    name: 'Kitchen Capacity',
    description: 'More grill spots, plates, cup slots, fryer baskets and warmer space.',
    levelEffects: [
      '2 grill · 2 plates · 2 cups · 1 basket',
      '+1 grill spot',
      '+1 plate',
      '+1 cup slot, bigger warmer',
      '+1 fryer basket',
      '+1 grill spot, +1 plate',
    ],
    costs: [120, 300, 550, 900, 1400],
  },
  foodQuality: {
    type: 'foodQuality',
    name: 'Prime Ingredients',
    description: 'Better ingredients – every dish sells for more.',
    levelEffects: ['Standard prices', '+8% prices', '+16% prices', '+24% prices', '+32% prices', '+40% prices'],
    costs: [100, 250, 500, 850, 1300],
  },
  patience: {
    type: 'patience',
    name: 'Cozy Decor',
    description: 'A comfier diner – customers wait longer before leaving.',
    levelEffects: ['Plain decor', '+8% patience', '+16% patience', '+24% patience', '+32% patience', '+40% patience'],
    costs: [90, 220, 450, 800, 1250],
  },
  startingStock: {
    type: 'startingStock',
    name: 'Pantry Stock',
    description: 'Ingredient bins hold more before they need restocking.',
    levelEffects: ['Standard bins', '+2 per bin', '+4 per bin', '+6 per bin', '+8 per bin', '+10 per bin'],
    costs: [60, 150, 300, 550, 900],
  },
  servingEfficiency: {
    type: 'servingEfficiency',
    name: 'Service Training',
    description: 'Faster drink pouring and restocking, longer combo window and better tips.',
    levelEffects: ['Basic service', 'Level 1 training', 'Level 2 training', 'Level 3 training', 'Level 4 training', 'Master service'],
    costs: [100, 240, 480, 820, 1300],
  },
};

export const MAX_UPGRADE_LEVEL = 5;

export type UpgradeLevels = Record<UpgradeType, number>;

export function emptyUpgradeLevels(): UpgradeLevels {
  return {
    grillSpeed: 0,
    fryerSpeed: 0,
    capacity: 0,
    foodQuality: 0,
    patience: 0,
    startingStock: 0,
    servingEfficiency: 0,
  };
}

/** Returns the cost for buying the next level, or null when maxed. */
export function nextUpgradeCost(type: UpgradeType, currentLevel: number): number | null {
  const def = UPGRADES[type];
  if (currentLevel >= def.costs.length) return null;
  return def.costs[currentLevel];
}

/** All tunable kitchen parameters, after upgrades are applied. */
export interface KitchenModifiers {
  grillSlots: number;
  plates: number;
  fryerBaskets: number;
  warmerCapacity: number;
  friesPerBatch: number;
  cupSlots: number;
  shakerSlots: number;
  pattyCookTime: number;
  pattyBurnTime: number;
  friesCookTime: number;
  friesBurnTime: number;
  drinkFillTime: number;
  shakeBlendTime: number;
  shakeMeltTime: number;
  restockTime: number;
  binStock: Record<IngredientId, number>;
  priceMult: number;
  patienceMult: number;
  tipMult: number;
  comboWindow: number;
}

const SPEED_MULT = [1, 0.9, 0.8, 0.7, 0.62, 0.55];

function clampLevel(n: number | undefined): number {
  if (!n || n < 0) return 0;
  return Math.min(MAX_UPGRADE_LEVEL, Math.floor(n));
}

export function computeKitchenModifiers(levels: Partial<UpgradeLevels>): KitchenModifiers {
  const g = clampLevel(levels.grillSpeed);
  const f = clampLevel(levels.fryerSpeed);
  const c = clampLevel(levels.capacity);
  const q = clampLevel(levels.foodQuality);
  const p = clampLevel(levels.patience);
  const s = clampLevel(levels.startingStock);
  const e = clampLevel(levels.servingEfficiency);

  const binStock = {} as Record<IngredientId, number>;
  for (const ing of Object.values(INGREDIENTS)) {
    binStock[ing.id] = ing.baseStock + ing.stockPerUpgrade * s;
  }

  return {
    grillSlots: [2, 3, 3, 3, 3, 4][c],
    plates: [2, 2, 3, 3, 3, 4][c],
    cupSlots: [2, 2, 2, 3, 3, 3][c],
    fryerBaskets: [1, 1, 1, 1, 2, 2][c],
    warmerCapacity: [4, 4, 4, 6, 6, 6][c],
    friesPerBatch: 3,
    shakerSlots: 2,
    pattyCookTime: 5 * SPEED_MULT[g],
    pattyBurnTime: 6 * (1 + 0.15 * g),
    friesCookTime: 4.5 * SPEED_MULT[f],
    friesBurnTime: 7 * (1 + 0.15 * f),
    drinkFillTime: 2.5 * (1 - 0.1 * e),
    shakeBlendTime: 4,
    shakeMeltTime: 25,
    restockTime: 2.5 * (1 - 0.12 * e),
    binStock,
    priceMult: 1 + 0.08 * q,
    patienceMult: 1 + 0.08 * p,
    tipMult: 1 + 0.06 * e,
    comboWindow: 5 + 0.5 * e,
  };
}
