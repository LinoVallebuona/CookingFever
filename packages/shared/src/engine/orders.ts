import { CUSTOMER_TYPES, type CustomerTypeId } from '../config/customers';
import type { LevelDef } from '../config/levels';
import { MENU, type MenuItemId, type MenuItemKind } from '../config/menu';
import type { Rng } from '../rng';
import type { OrderItem } from './types';

/** Maximum number of items of the same kind in a single order. */
const KIND_CAP: Record<MenuItemKind, number> = { burger: 2, fries: 1, drink: 1, shake: 1 };

/** Generates an order for a customer of the given type on the given level. */
export function generateOrder(rng: Rng, level: LevelDef, type: CustomerTypeId): OrderItem[] {
  const t = CUSTOMER_TYPES[type];
  const max = Math.max(1, Math.min(t.maxItems, level.maxItemsPerOrder));
  const min = Math.min(t.minItems, max);
  const count = rng.int(min, max);
  const kindCount: Record<MenuItemKind, number> = { burger: 0, fries: 0, drink: 0, shake: 0 };
  const items: OrderItem[] = [];
  for (let i = 0; i < count; i++) {
    const weights: Partial<Record<MenuItemId, number>> = {};
    let any = false;
    for (const id of level.menu) {
      const def = MENU[id];
      if (kindCount[def.kind] >= KIND_CAP[def.kind]) continue;
      weights[id] = def.weight;
      any = true;
    }
    if (!any) break;
    const id = rng.weighted(weights);
    kindCount[MENU[id].kind]++;
    items.push({ item: id, served: false });
  }
  // Show burgers first, then sides, then drinks – reads nicely in the bubble.
  const order: MenuItemKind[] = ['burger', 'fries', 'drink', 'shake'];
  items.sort((a, b) => order.indexOf(MENU[a.item].kind) - order.indexOf(MENU[b.item].kind));
  return items;
}

export function orderValue(order: OrderItem[], priceMult: number): number {
  return order.reduce((s, o) => s + Math.round(MENU[o.item].price * priceMult), 0);
}
