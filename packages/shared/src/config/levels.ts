import { CUSTOMER_TYPES, type CustomerTypeId } from './customers';
import { MENU, type MenuItemId } from './menu';

export type ObjectiveType = 'maxLost' | 'minSatisfaction' | 'minCombo' | 'minServed';

export interface BonusObjective {
  type: ObjectiveType;
  value: number;
}

export interface LevelDef {
  /** 1-based level number inside its restaurant. */
  number: number;
  restaurantId: string;
  name: string;
  /** Shift length in seconds. */
  duration: number;
  /** Total customers that will visit during the shift. */
  customers: number;
  /** Delay range (seconds) between customer arrivals. */
  spawnInterval: [number, number];
  firstSpawnDelay: number;
  /** Number of counter spots (simultaneous customers). */
  seats: number;
  menu: MenuItemId[];
  /** Upper bound of items in a single order. */
  maxItemsPerOrder: number;
  customerTypes: Partial<Record<CustomerTypeId, number>>;
  /** Base patience in seconds (before customer type + upgrades). */
  basePatience: number;
  /** Coins required for 1, 2 and 3 stars. */
  targets: [number, number, number];
  /** Extra objective required for the 3rd star. */
  bonusObjective: BonusObjective;
  /** 1 (easy) .. 5 (hard). */
  difficulty: number;
  /** Coins awarded the first time the level is passed. */
  firstClearReward: number;
  /** Short hints shown before the level starts (new mechanics). */
  intro: string[];
}

type LevelSeed = Omit<LevelDef, 'targets' | 'restaurantId' | 'firstClearReward'> & {
  targetFactors?: [number, number, number];
};

const R = { regular: 1 };

const SEEDS: LevelSeed[] = [
  { number: 1, name: 'Grand Opening', duration: 100, customers: 6, spawnInterval: [7, 10], firstSpawnDelay: 1.5, seats: 2, menu: ['hamburger', 'cola'], maxItemsPerOrder: 2, customerTypes: R, basePatience: 50, bonusObjective: { type: 'maxLost', value: 0 }, difficulty: 1,
    intro: ['Tap the patty box to grill a patty.', 'Tap a plate to put a bun on it, then tap the cooked patty.', 'Tap a finished burger or a full soda to serve it.'] },
  { number: 2, name: 'Say Cheese', duration: 105, customers: 8, spawnInterval: [6, 9], firstSpawnDelay: 1.5, seats: 2, menu: ['hamburger', 'cheeseburger', 'cola'], maxItemsPerOrder: 2, customerTypes: R, basePatience: 48, bonusObjective: { type: 'minSatisfaction', value: 70 }, difficulty: 1,
    intro: ['New: Cheeseburger! Add a cheese slice to a burger.', 'Tip: drag an ingredient onto a specific plate.'] },
  { number: 3, name: 'Fry Day', duration: 110, customers: 9, spawnInterval: [6, 9], firstSpawnDelay: 1.5, seats: 3, menu: ['hamburger', 'cheeseburger', 'fries', 'cola'], maxItemsPerOrder: 2, customerTypes: { regular: 3, senior: 1 }, basePatience: 46, bonusObjective: { type: 'maxLost', value: 1 }, difficulty: 1,
    intro: ['New: French Fries! Tap the fryer basket to fry potatoes.', 'Tap golden fries to move them to the warmer, then tap the warmer to serve.'] },
  { number: 4, name: 'Lunch Crowd', duration: 115, customers: 10, spawnInterval: [5, 8], firstSpawnDelay: 1.5, seats: 3, menu: ['hamburger', 'cheeseburger', 'fries', 'cola'], maxItemsPerOrder: 3, customerTypes: { regular: 3, senior: 1 }, basePatience: 44, bonusObjective: { type: 'minCombo', value: 3 }, difficulty: 2,
    intro: ['Bigger orders today!', 'Serve customers back-to-back to build a combo bonus.'] },
  { number: 5, name: 'In a Hurry', duration: 120, customers: 11, spawnInterval: [5, 8], firstSpawnDelay: 1.5, seats: 3, menu: ['hamburger', 'cheeseburger', 'fries', 'cola'], maxItemsPerOrder: 3, customerTypes: { regular: 3, senior: 1, rusher: 1 }, basePatience: 42, bonusObjective: { type: 'minSatisfaction', value: 70 }, difficulty: 2,
    intro: ['New customer: the Office Rusher – impatient, but tips big!'] },
  { number: 6, name: 'Garden Fresh', duration: 125, customers: 11, spawnInterval: [5, 8], firstSpawnDelay: 1.5, seats: 3, menu: ['hamburger', 'cheeseburger', 'gardenBurger', 'fries', 'cola'], maxItemsPerOrder: 3, customerTypes: { regular: 3, senior: 1, rusher: 1 }, basePatience: 42, bonusObjective: { type: 'maxLost', value: 1 }, difficulty: 2,
    intro: ['New: Garden Burger – patty with lettuce and tomato.'] },
  { number: 7, name: 'Full House', duration: 130, customers: 13, spawnInterval: [4.5, 7.5], firstSpawnDelay: 1.5, seats: 4, menu: ['hamburger', 'cheeseburger', 'gardenBurger', 'fries', 'cola'], maxItemsPerOrder: 3, customerTypes: { regular: 3, senior: 1, rusher: 1 }, basePatience: 40, bonusObjective: { type: 'minCombo', value: 3 }, difficulty: 2,
    intro: ['A fourth spot opens at the counter. Keep everyone happy!'] },
  { number: 8, name: 'Big Appetites', duration: 135, customers: 13, spawnInterval: [5, 8], firstSpawnDelay: 1.5, seats: 4, menu: ['hamburger', 'cheeseburger', 'gardenBurger', 'fries', 'cola'], maxItemsPerOrder: 4, customerTypes: { regular: 3, senior: 1, rusher: 1, bigEater: 1 }, basePatience: 40, bonusObjective: { type: 'minSatisfaction', value: 70 }, difficulty: 3,
    intro: ['New customer: the Big Eater orders up to 4 items!'] },
  { number: 9, name: 'Deluxe Debut', duration: 140, customers: 14, spawnInterval: [4.5, 7], firstSpawnDelay: 1.5, seats: 4, menu: ['hamburger', 'cheeseburger', 'gardenBurger', 'deluxeBurger', 'fries', 'cola'], maxItemsPerOrder: 3, customerTypes: { regular: 3, senior: 1, rusher: 1, bigEater: 1 }, basePatience: 39, bonusObjective: { type: 'maxLost', value: 1 }, difficulty: 3,
    intro: ['New: Deluxe Burger – cheese, lettuce AND tomato.'] },
  { number: 10, name: 'Rush Hour', duration: 140, customers: 15, spawnInterval: [4, 6.5], firstSpawnDelay: 1.5, seats: 4, menu: ['hamburger', 'cheeseburger', 'gardenBurger', 'deluxeBurger', 'fries', 'cola'], maxItemsPerOrder: 3, customerTypes: { regular: 2, senior: 1, rusher: 2, bigEater: 1 }, basePatience: 38, bonusObjective: { type: 'minCombo', value: 4 }, difficulty: 3,
    intro: ['Rush hour! Customers arrive faster than ever.'] },
  { number: 11, name: 'Weekend Special', duration: 150, customers: 16, spawnInterval: [4, 6.5], firstSpawnDelay: 1.5, seats: 4, menu: ['hamburger', 'cheeseburger', 'gardenBurger', 'deluxeBurger', 'fries', 'cola'], maxItemsPerOrder: 3, customerTypes: { regular: 3, senior: 1, rusher: 2, bigEater: 1 }, basePatience: 37, bonusObjective: { type: 'minSatisfaction', value: 72 }, difficulty: 3,
    intro: ['Weekend crowds love variety.'] },
  { number: 12, name: 'Stock Up', duration: 150, customers: 16, spawnInterval: [4, 6.5], firstSpawnDelay: 1.5, seats: 4, menu: ['hamburger', 'cheeseburger', 'gardenBurger', 'deluxeBurger', 'fries', 'cola'], maxItemsPerOrder: 4, customerTypes: { regular: 2, senior: 1, rusher: 2, bigEater: 2 }, basePatience: 36, bonusObjective: { type: 'maxLost', value: 2 }, difficulty: 3,
    intro: ['Keep an eye on your ingredient bins – tap an empty bin to restock.'] },
  { number: 13, name: 'Shake It Up', duration: 155, customers: 16, spawnInterval: [4, 6.5], firstSpawnDelay: 1.5, seats: 4, menu: ['hamburger', 'cheeseburger', 'gardenBurger', 'deluxeBurger', 'fries', 'cola', 'milkshake'], maxItemsPerOrder: 3, customerTypes: { regular: 3, senior: 1, rusher: 2, bigEater: 1 }, basePatience: 37, bonusObjective: { type: 'minSatisfaction', value: 70 }, difficulty: 3,
    intro: ['New: Milkshakes! Tap the blender to mix one. Serve before it melts.'] },
  { number: 14, name: 'The Critic', duration: 155, customers: 17, spawnInterval: [4, 6.2], firstSpawnDelay: 1.5, seats: 4, menu: ['hamburger', 'cheeseburger', 'gardenBurger', 'deluxeBurger', 'fries', 'cola', 'milkshake'], maxItemsPerOrder: 3, customerTypes: { regular: 3, senior: 1, rusher: 2, bigEater: 1, critic: 1 }, basePatience: 36, bonusObjective: { type: 'maxLost', value: 2 }, difficulty: 4,
    intro: ['A Food Critic is in town – impatient, but the best tipper.'] },
  { number: 15, name: 'Double Shift', duration: 160, customers: 18, spawnInterval: [3.8, 6], firstSpawnDelay: 1.5, seats: 4, menu: ['hamburger', 'cheeseburger', 'gardenBurger', 'deluxeBurger', 'fries', 'cola', 'milkshake'], maxItemsPerOrder: 4, customerTypes: { regular: 3, senior: 1, rusher: 2, bigEater: 2, critic: 1 }, basePatience: 35, bonusObjective: { type: 'minCombo', value: 4 }, difficulty: 4,
    intro: ['A long shift ahead. Pace yourself!'] },
  { number: 16, name: 'Food Festival', duration: 165, customers: 19, spawnInterval: [3.8, 6], firstSpawnDelay: 1.5, seats: 4, menu: ['hamburger', 'cheeseburger', 'gardenBurger', 'deluxeBurger', 'fries', 'cola', 'milkshake'], maxItemsPerOrder: 4, customerTypes: { regular: 3, senior: 1, rusher: 2, bigEater: 2, critic: 1 }, basePatience: 35, bonusObjective: { type: 'minSatisfaction', value: 75 }, difficulty: 4,
    intro: ['Festival visitors want the full menu.'] },
  { number: 17, name: 'Game Night', duration: 165, customers: 20, spawnInterval: [3.6, 5.8], firstSpawnDelay: 1.5, seats: 4, menu: ['hamburger', 'cheeseburger', 'gardenBurger', 'deluxeBurger', 'fries', 'cola', 'milkshake'], maxItemsPerOrder: 4, customerTypes: { regular: 2, senior: 1, rusher: 3, bigEater: 2, critic: 1 }, basePatience: 34, bonusObjective: { type: 'maxLost', value: 2 }, difficulty: 4,
    intro: ['The big game is on – fans are hungry and in a hurry.'] },
  { number: 18, name: "Critics' Choice", duration: 170, customers: 20, spawnInterval: [3.6, 5.8], firstSpawnDelay: 1.5, seats: 4, menu: ['hamburger', 'cheeseburger', 'gardenBurger', 'deluxeBurger', 'fries', 'cola', 'milkshake'], maxItemsPerOrder: 4, customerTypes: { regular: 2, senior: 1, rusher: 2, bigEater: 1, critic: 3 }, basePatience: 34, bonusObjective: { type: 'minCombo', value: 5 }, difficulty: 5,
    intro: ['A whole table of critics. Impress them!'] },
  { number: 19, name: 'Holiday Madness', duration: 175, customers: 21, spawnInterval: [3.5, 5.5], firstSpawnDelay: 1.5, seats: 4, menu: ['hamburger', 'cheeseburger', 'gardenBurger', 'deluxeBurger', 'fries', 'cola', 'milkshake'], maxItemsPerOrder: 4, customerTypes: { regular: 3, senior: 1, rusher: 3, bigEater: 2, critic: 2 }, basePatience: 33, bonusObjective: { type: 'minSatisfaction', value: 75 }, difficulty: 5,
    intro: ['Holiday rush – the busiest day of the year!'] },
  { number: 20, name: 'Sizzle Master', duration: 180, customers: 23, spawnInterval: [3.3, 5.2], firstSpawnDelay: 1.5, seats: 4, menu: ['hamburger', 'cheeseburger', 'gardenBurger', 'deluxeBurger', 'fries', 'cola', 'milkshake'], maxItemsPerOrder: 4, customerTypes: { regular: 2, senior: 1, rusher: 3, bigEater: 2, critic: 2 }, basePatience: 32, bonusObjective: { type: 'maxLost', value: 2 }, difficulty: 5,
    intro: ['The final exam. Become the Sizzle Master!'] },
];

/** Expected base value (coins, before tips/upgrades) of one customer's order. */
export function expectedCustomerValue(seed: Pick<LevelDef, 'menu' | 'maxItemsPerOrder' | 'customerTypes'>): number {
  const totalW = seed.menu.reduce((s, id) => s + MENU[id].weight, 0);
  const avgPrice = seed.menu.reduce((s, id) => s + MENU[id].price * MENU[id].weight, 0) / totalW;
  const typeEntries = Object.entries(seed.customerTypes) as [CustomerTypeId, number][];
  const typeW = typeEntries.reduce((s, [, w]) => s + w, 0);
  let avgItems = 0;
  for (const [id, w] of typeEntries) {
    const t = CUSTOMER_TYPES[id];
    const max = Math.max(t.minItems, Math.min(t.maxItems, seed.maxItemsPerOrder));
    const min = Math.min(t.minItems, max);
    avgItems += ((min + max) / 2) * (w / typeW);
  }
  return avgItems * avgPrice;
}

const round5 = (n: number) => Math.max(5, Math.round(n / 5) * 5);

function buildLevel(seed: LevelSeed): LevelDef {
  const { targetFactors = [0.75, 1.0, 1.25], ...rest } = seed;
  const total = expectedCustomerValue(seed) * seed.customers;
  return {
    ...rest,
    restaurantId: 'diner',
    targets: [round5(total * targetFactors[0]), round5(total * targetFactors[1]), round5(total * targetFactors[2])],
    firstClearReward: 40 + seed.number * 10,
  };
}

export const DINER_LEVELS: LevelDef[] = SEEDS.map(buildLevel);

export const LEVELS_BY_RESTAURANT: Record<string, LevelDef[]> = {
  diner: DINER_LEVELS,
};

export function getLevelDef(restaurantId: string, levelNumber: number): LevelDef | undefined {
  return LEVELS_BY_RESTAURANT[restaurantId]?.find((l) => l.number === levelNumber);
}

export function describeObjective(o: BonusObjective): string {
  switch (o.type) {
    case 'maxLost':
      return o.value === 0 ? 'Lose no customers' : `Lose at most ${o.value} customer${o.value === 1 ? '' : 's'}`;
    case 'minSatisfaction':
      return `Satisfaction ${o.value}% or higher`;
    case 'minCombo':
      return `Reach a ${o.value}x combo`;
    case 'minServed':
      return `Serve at least ${o.value} customers`;
  }
}
