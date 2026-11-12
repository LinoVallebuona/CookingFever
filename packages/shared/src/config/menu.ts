/** Ingredients and menu items for the American Diner. */

export type IngredientId = 'bun' | 'patty' | 'cheese' | 'lettuce' | 'tomato' | 'fries' | 'cup' | 'milk';
export type BurgerTopping = 'cheese' | 'lettuce' | 'tomato';
export const BURGER_TOPPINGS: BurgerTopping[] = ['cheese', 'lettuce', 'tomato'];

export interface IngredientDef {
  id: IngredientId;
  name: string;
  /** Base number of units in a bin before it must be restocked. */
  baseStock: number;
  /** Extra units per "Pantry Stock" upgrade level. */
  stockPerUpgrade: number;
}

export const INGREDIENTS: Record<IngredientId, IngredientDef> = {
  bun: { id: 'bun', name: 'Buns', baseStock: 6, stockPerUpgrade: 2 },
  patty: { id: 'patty', name: 'Patties', baseStock: 6, stockPerUpgrade: 2 },
  cheese: { id: 'cheese', name: 'Cheese', baseStock: 6, stockPerUpgrade: 2 },
  lettuce: { id: 'lettuce', name: 'Lettuce', baseStock: 6, stockPerUpgrade: 2 },
  tomato: { id: 'tomato', name: 'Tomato', baseStock: 6, stockPerUpgrade: 2 },
  fries: { id: 'fries', name: 'Potato Bags', baseStock: 4, stockPerUpgrade: 1 },
  cup: { id: 'cup', name: 'Cups', baseStock: 6, stockPerUpgrade: 2 },
  milk: { id: 'milk', name: 'Milk', baseStock: 4, stockPerUpgrade: 1 },
};

export type MenuItemId =
  | 'hamburger'
  | 'cheeseburger'
  | 'gardenBurger'
  | 'deluxeBurger'
  | 'fries'
  | 'cola'
  | 'milkshake';

export type MenuItemKind = 'burger' | 'fries' | 'drink' | 'shake';

export interface MenuItemDef {
  id: MenuItemId;
  name: string;
  kind: MenuItemKind;
  /** Base price in coins (before Food Quality upgrade). */
  price: number;
  /** Burger toppings required (exact match) for burger items. */
  toppings?: BurgerTopping[];
  /** Ingredients this item introduces (for "new item" hints). */
  ingredients: IngredientId[];
  /** Relative weight when generating orders. */
  weight: number;
}

export const MENU: Record<MenuItemId, MenuItemDef> = {
  hamburger: { id: 'hamburger', name: 'Hamburger', kind: 'burger', price: 8, toppings: [], ingredients: ['bun', 'patty'], weight: 4 },
  cheeseburger: { id: 'cheeseburger', name: 'Cheeseburger', kind: 'burger', price: 10, toppings: ['cheese'], ingredients: ['bun', 'patty', 'cheese'], weight: 4 },
  gardenBurger: { id: 'gardenBurger', name: 'Garden Burger', kind: 'burger', price: 12, toppings: ['lettuce', 'tomato'], ingredients: ['bun', 'patty', 'lettuce', 'tomato'], weight: 3 },
  deluxeBurger: { id: 'deluxeBurger', name: 'Deluxe Burger', kind: 'burger', price: 15, toppings: ['cheese', 'lettuce', 'tomato'], ingredients: ['bun', 'patty', 'cheese', 'lettuce', 'tomato'], weight: 3 },
  fries: { id: 'fries', name: 'French Fries', kind: 'fries', price: 5, ingredients: ['fries'], weight: 4 },
  cola: { id: 'cola', name: 'Soda', kind: 'drink', price: 4, ingredients: ['cup'], weight: 4 },
  milkshake: { id: 'milkshake', name: 'Milkshake', kind: 'shake', price: 7, ingredients: ['milk'], weight: 3 },
};

export const BURGER_IDS: MenuItemId[] = ['hamburger', 'cheeseburger', 'gardenBurger', 'deluxeBurger'];

/** Returns the burger menu id matching an exact topping set, or null. */
export function burgerForToppings(toppings: readonly BurgerTopping[]): MenuItemId | null {
  const key = [...toppings].sort().join(',');
  for (const id of BURGER_IDS) {
    const t = MENU[id].toppings!;
    if ([...t].sort().join(',') === key) return id;
  }
  return null;
}
