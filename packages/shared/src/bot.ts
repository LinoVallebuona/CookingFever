/**
 * A simple heuristic auto-player. Used by tests to verify that every level is
 * winnable, that replays are deterministic, and to balance revenue targets.
 * Not part of the shipped game UI.
 */
import { burgerForToppings, MENU, type BurgerTopping, type MenuItemId } from './config/menu';
import type { GameEngine } from './engine/GameEngine';
import type { PlayerAction } from './engine/types';

export function chooseBotAction(engine: GameEngine): PlayerAction | null {
  const s = engine.state;
  const needs: MenuItemId[] = [];
  const waiting = s.customers.filter((c) => c.phase === 'waiting').sort((a, b) => a.patience - b.patience);
  for (const c of waiting) for (const o of c.order) if (!o.served) needs.push(o.item);
  const count = (id: MenuItemId) => needs.filter((n) => n === id).length;

  // 1. Serve anything ready that somebody wants.
  for (let i = 0; i < s.plates.length; i++) {
    const p = s.plates[i];
    if (p.bun && p.patty) {
      const b = burgerForToppings(p.toppings);
      if (b && needs.includes(b)) return { type: 'plate', plate: i };
    }
  }
  if (s.warmer.portions > 0 && count('fries') > 0) return { type: 'warmer' };
  for (let i = 0; i < s.cups.length; i++) if (s.cups[i].state === 'full' && count('cola') > 0) return { type: 'cup', slot: i };
  for (let i = 0; i < s.shakers.length; i++) if (s.shakers[i].state === 'ready' && count('milkshake') > 0) return { type: 'shaker', slot: i };

  // 2. Rescue / clear stations.
  for (let i = 0; i < s.grill.length; i++) if (s.grill[i].state === 'burnt') return { type: 'grill', slot: i };
  for (let i = 0; i < s.fryer.length; i++) if (s.fryer[i].state === 'burnt') return { type: 'fryer', basket: i };
  for (let i = 0; i < s.shakers.length; i++) if (s.shakers[i].state === 'melted') return { type: 'shaker', slot: i };
  for (let i = 0; i < s.fryer.length; i++) if (s.fryer[i].state === 'done' && s.warmer.portions < s.warmer.capacity) return { type: 'fryer', basket: i };

  // 3. Restock empty bins.
  for (const id of s.ingredients) {
    const bin = s.bins[id];
    if (bin.stock === 0 && bin.restocking === 0) return { type: 'bin', bin: id };
  }

  // 4. Burger pipeline: assign each plate to a burger need.
  const burgerNeeds = needs.filter((n) => MENU[n].kind === 'burger');
  const remaining = [...burgerNeeds];
  const plateTarget: (MenuItemId | null)[] = s.plates.map(() => null);
  // complete burgers first
  s.plates.forEach((p, i) => {
    if (!p.bun || !p.patty) return;
    const b = burgerForToppings(p.toppings);
    const k = b ? remaining.indexOf(b) : -1;
    if (k >= 0) {
      plateTarget[i] = b;
      remaining.splice(k, 1);
    }
  });
  s.plates.forEach((p, i) => {
    if (!p.bun || plateTarget[i]) return;
    const k = remaining.findIndex((n) => p.toppings.every((t) => MENU[n].toppings!.includes(t)));
    if (k >= 0) {
      plateTarget[i] = remaining[k];
      remaining.splice(k, 1);
    }
  });
  for (let i = 0; i < s.plates.length; i++) {
    const p = s.plates[i];
    const target = plateTarget[i];
    if (!p.bun || !target) continue;
    if (!p.patty) {
      const g = s.grill.findIndex((x) => x.state === 'cooked');
      if (g >= 0) return { type: 'grill', slot: g, plate: i };
    }
    const missing = MENU[target].toppings!.find((t) => !p.toppings.includes(t));
    if (missing && s.bins[missing as BurgerTopping].restocking === 0) return { type: 'bin', bin: missing, plate: i };
  }
  if (remaining.length > 0) {
    // Discard a useless plate if no empty plate is available.
    const empty = s.plates.findIndex((p) => !p.bun);
    if (empty >= 0) {
      if (s.bins.bun.restocking === 0) return { type: 'bin', bin: 'bun', plate: empty };
    } else {
      const useless = s.plates.findIndex((p, i) => p.bun && !plateTarget[i] && p.toppings.length > 0);
      if (useless >= 0) return { type: 'discard', station: 'plate', index: useless };
    }
  }

  // 5. Start cooking what is needed.
  const patties = s.grill.filter((g) => g.state === 'raw' || g.state === 'cooked').length + s.plates.filter((p) => p.patty).length;
  if (burgerNeeds.length > patties && s.grill.some((g) => g.state === 'empty') && s.bins.patty.restocking === 0) return { type: 'bin', bin: 'patty' };
  const fries = s.warmer.portions + s.fryer.reduce((n, b) => n + (b.state === 'frying' ? engine.mods.friesPerBatch : b.state === 'done' ? b.portions : 0), 0);
  if (count('fries') > fries && s.fryer.some((b) => b.state === 'empty') && s.bins.fries.restocking === 0) return { type: 'bin', bin: 'fries' };
  const drinks = s.cups.filter((c) => c.state !== 'empty').length;
  if (count('cola') > drinks && s.cups.some((c) => c.state === 'empty') && s.bins.cup.restocking === 0) return { type: 'bin', bin: 'cup' };
  const shakes = s.shakers.filter((c) => c.state === 'blending' || c.state === 'ready').length;
  if (count('milkshake') > shakes && s.shakers.some((c) => c.state === 'empty') && s.bins.milk.restocking === 0) return { type: 'bin', bin: 'milk' };
  return null;
}

/** Plays a full level with a fixed reaction time (in ticks) between actions. */
export function playWithBot(engine: GameEngine, reactionTicks = 15): void {
  let cooldown = 0;
  while (!engine.finished) {
    if (cooldown <= 0) {
      const a = chooseBotAction(engine);
      if (a) {
        engine.dispatch(a);
        cooldown = reactionTicks;
      }
    } else cooldown--;
    engine.step();
  }
}
