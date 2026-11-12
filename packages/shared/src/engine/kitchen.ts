import { burgerForToppings, type BurgerTopping, type IngredientId } from '../config/menu';
import type { EngineContext } from './context';
import { serveItem } from './scoring';
import { DT, type DiscardStation, type PlayerAction, type SourceRef } from './types';

const TOPPINGS: IngredientId[] = ['cheese', 'lettuce', 'tomato'];

/** Advances all cooking timers and restocks. */
export function updateKitchen(ctx: EngineContext): void {
  const { state, mods } = ctx;

  state.grill.forEach((g, index) => {
    if (g.state === 'raw' || g.state === 'cooked') {
      g.timer += DT;
      if (g.state === 'raw' && g.timer >= mods.pattyCookTime) {
        g.state = 'cooked';
        ctx.emit({ type: 'cooked', source: { kind: 'grill', index } });
      } else if (g.state === 'cooked' && g.timer >= mods.pattyCookTime + mods.pattyBurnTime) {
        g.state = 'burnt';
        ctx.emit({ type: 'burnt', source: { kind: 'grill', index } });
      }
    }
  });

  state.fryer.forEach((b, index) => {
    if (b.state === 'frying' || b.state === 'done') {
      b.timer += DT;
      if (b.state === 'frying' && b.timer >= mods.friesCookTime) {
        b.state = 'done';
        b.portions = mods.friesPerBatch;
        ctx.emit({ type: 'cooked', source: { kind: 'fryer', index } });
      } else if (b.state === 'done' && b.timer >= mods.friesCookTime + mods.friesBurnTime) {
        b.state = 'burnt';
        ctx.emit({ type: 'burnt', source: { kind: 'fryer', index } });
      }
    }
  });

  state.cups.forEach((c, index) => {
    if (c.state === 'filling') {
      c.timer += DT;
      if (c.timer >= mods.drinkFillTime) {
        c.state = 'full';
        ctx.emit({ type: 'cooked', source: { kind: 'cup', index } });
      }
    }
  });

  state.shakers.forEach((s, index) => {
    if (s.state === 'blending' || s.state === 'ready') {
      s.timer += DT;
      if (s.state === 'blending' && s.timer >= mods.shakeBlendTime) {
        s.state = 'ready';
        ctx.emit({ type: 'cooked', source: { kind: 'shaker', index } });
      } else if (s.state === 'ready' && s.timer >= mods.shakeBlendTime + mods.shakeMeltTime) {
        s.state = 'melted';
        ctx.emit({ type: 'burnt', source: { kind: 'shaker', index } });
      }
    }
  });

  for (const id of state.ingredients) {
    const bin = state.bins[id];
    if (bin.restocking > 0) {
      bin.restocking -= DT;
      if (bin.restocking <= 0) {
        bin.restocking = 0;
        bin.stock = bin.max;
        ctx.emit({ type: 'restocked', bin: id });
      }
    }
  }
}

/** Takes one unit from a bin. Starts a restock (and fails) when the bin is empty. */
function takeFromBin(ctx: EngineContext, id: IngredientId): boolean {
  const bin = ctx.state.bins[id];
  if (!ctx.state.ingredients.includes(id)) {
    ctx.emit({ type: 'invalid', reason: 'Not on the menu yet', source: { kind: 'bin', bin: id } });
    return false;
  }
  if (bin.restocking > 0) {
    ctx.emit({ type: 'invalid', reason: 'Restocking…', source: { kind: 'bin', bin: id } });
    return false;
  }
  if (bin.stock <= 0) {
    startRestock(ctx, id);
    return false;
  }
  bin.stock--;
  return true;
}

function startRestock(ctx: EngineContext, id: IngredientId): void {
  const bin = ctx.state.bins[id];
  if (bin.restocking > 0 || bin.stock >= bin.max) return;
  bin.restocking = ctx.mods.restockTime;
  ctx.emit({ type: 'restockStarted', bin: id });
}

function validIndex(arr: unknown[], i: number | undefined): i is number {
  return typeof i === 'number' && Number.isInteger(i) && i >= 0 && i < arr.length;
}

function invalid(ctx: EngineContext, reason: string, source?: SourceRef): false {
  ctx.emit({ type: 'invalid', reason, source });
  return false;
}

/** Applies a player action. Returns true when the action changed the game state. */
export function applyAction(ctx: EngineContext, action: PlayerAction): boolean {
  switch (action.type) {
    case 'bin':
      return binAction(ctx, action.bin, action.plate);
    case 'grill':
      return grillAction(ctx, action.slot, action.plate);
    case 'plate':
      return plateAction(ctx, action.plate, action.customer);
    case 'fryer':
      return fryerAction(ctx, action.basket);
    case 'warmer':
      return warmerAction(ctx, action.customer);
    case 'cup':
      return cupAction(ctx, action.slot, action.customer);
    case 'shaker':
      return shakerAction(ctx, action.slot, action.customer);
    case 'discard':
      return discardAction(ctx, action.station, action.index);
    default:
      return false;
  }
}

function binAction(ctx: EngineContext, id: IngredientId, plateIndex?: number): boolean {
  const { state } = ctx;
  if (!state.ingredients.includes(id)) return invalid(ctx, 'Not on the menu yet', { kind: 'bin', bin: id });
  const bin = state.bins[id];
  if (bin.restocking <= 0 && bin.stock <= 0) {
    startRestock(ctx, id);
    return true;
  }
  switch (id) {
    case 'bun': {
      const idx = plateIndex !== undefined ? plateIndex : state.plates.findIndex((p) => !p.bun);
      if (!validIndex(state.plates, idx)) return invalid(ctx, 'No free plate', { kind: 'bin', bin: id });
      if (state.plates[idx].bun) return invalid(ctx, 'Plate already has a bun', { kind: 'plate', index: idx });
      if (!takeFromBin(ctx, id)) return false;
      state.plates[idx].bun = true;
      ctx.emit({ type: 'placed', source: { kind: 'plate', index: idx }, ingredient: id });
      return true;
    }
    case 'patty': {
      const idx = state.grill.findIndex((g) => g.state === 'empty');
      if (idx < 0) return invalid(ctx, 'Grill is full', { kind: 'bin', bin: id });
      if (!takeFromBin(ctx, id)) return false;
      state.grill[idx] = { state: 'raw', timer: 0 };
      ctx.emit({ type: 'placed', source: { kind: 'grill', index: idx }, ingredient: id });
      return true;
    }
    case 'cheese':
    case 'lettuce':
    case 'tomato': {
      const topping = id as BurgerTopping;
      let idx: number;
      if (plateIndex !== undefined) {
        idx = plateIndex;
        if (!validIndex(state.plates, idx)) return invalid(ctx, 'No such plate');
        const p = state.plates[idx];
        if (!p.bun) return invalid(ctx, 'Put a bun down first', { kind: 'plate', index: idx });
        if (p.toppings.includes(topping)) return invalid(ctx, 'Already added', { kind: 'plate', index: idx });
      } else {
        idx = state.plates.findIndex((p) => p.bun && !p.toppings.includes(topping));
        if (idx < 0) return invalid(ctx, 'Put a bun on a plate first', { kind: 'bin', bin: id });
      }
      if (!takeFromBin(ctx, id)) return false;
      state.plates[idx].toppings.push(topping);
      ctx.emit({ type: 'placed', source: { kind: 'plate', index: idx }, ingredient: id });
      return true;
    }
    case 'fries': {
      const idx = state.fryer.findIndex((b) => b.state === 'empty');
      if (idx < 0) return invalid(ctx, 'Fryer is busy', { kind: 'bin', bin: id });
      return fryerAction(ctx, idx);
    }
    case 'cup': {
      const idx = state.cups.findIndex((c) => c.state === 'empty');
      if (idx < 0) return invalid(ctx, 'All cup slots are busy', { kind: 'bin', bin: id });
      return cupAction(ctx, idx);
    }
    case 'milk': {
      const idx = state.shakers.findIndex((s) => s.state === 'empty');
      if (idx < 0) return invalid(ctx, 'Blenders are busy', { kind: 'bin', bin: id });
      return shakerAction(ctx, idx);
    }
  }
}

function grillAction(ctx: EngineContext, slot: number, plateIndex?: number): boolean {
  const { state } = ctx;
  if (!validIndex(state.grill, slot)) return false;
  const g = state.grill[slot];
  const src: SourceRef = { kind: 'grill', index: slot };
  switch (g.state) {
    case 'empty':
      if (!takeFromBin(ctx, 'patty')) return false;
      state.grill[slot] = { state: 'raw', timer: 0 };
      ctx.emit({ type: 'placed', source: src, ingredient: 'patty' });
      return true;
    case 'raw':
      return invalid(ctx, 'Still cooking…', src);
    case 'burnt':
      state.grill[slot] = { state: 'empty', timer: 0 };
      state.stats.wasted++;
      ctx.emit({ type: 'trashed', source: src });
      return true;
    case 'cooked': {
      let idx: number;
      if (plateIndex !== undefined) {
        idx = plateIndex;
        if (!validIndex(state.plates, idx)) return false;
        const p = state.plates[idx];
        if (!p.bun) return invalid(ctx, 'Put a bun down first', { kind: 'plate', index: idx });
        if (p.patty) return invalid(ctx, 'Plate already has a patty', { kind: 'plate', index: idx });
      } else {
        idx = state.plates.findIndex((p) => p.bun && !p.patty);
        if (idx < 0) return invalid(ctx, 'Put a bun on a plate first', src);
      }
      state.plates[idx].patty = true;
      state.grill[slot] = { state: 'empty', timer: 0 };
      ctx.emit({ type: 'moved', from: src, to: { kind: 'plate', index: idx } });
      return true;
    }
  }
}

function plateAction(ctx: EngineContext, plateIndex: number, customer?: number): boolean {
  const { state } = ctx;
  if (!validIndex(state.plates, plateIndex)) return false;
  const p = state.plates[plateIndex];
  const src: SourceRef = { kind: 'plate', index: plateIndex };
  if (!p.bun) return binAction(ctx, 'bun', plateIndex);
  if (!p.patty) return invalid(ctx, 'Needs a cooked patty', src);
  const burger = burgerForToppings(p.toppings);
  if (!burger || !ctx.level.menu.includes(burger)) return invalid(ctx, 'Nobody ordered that', src);
  if (!serveItem(ctx, burger, src, customer)) return false;
  state.plates[plateIndex] = { bun: false, patty: false, toppings: [] };
  return true;
}

function fryerAction(ctx: EngineContext, basket: number): boolean {
  const { state } = ctx;
  if (!validIndex(state.fryer, basket)) return false;
  const b = state.fryer[basket];
  const src: SourceRef = { kind: 'fryer', index: basket };
  switch (b.state) {
    case 'empty':
      if (!takeFromBin(ctx, 'fries')) return false;
      state.fryer[basket] = { state: 'frying', timer: 0, portions: 0 };
      ctx.emit({ type: 'placed', source: src, ingredient: 'fries' });
      return true;
    case 'frying':
      return invalid(ctx, 'Still frying…', src);
    case 'burnt':
      state.fryer[basket] = { state: 'empty', timer: 0, portions: 0 };
      state.stats.wasted++;
      ctx.emit({ type: 'trashed', source: src });
      return true;
    case 'done': {
      const space = state.warmer.capacity - state.warmer.portions;
      if (space <= 0) return invalid(ctx, 'Warmer is full', src);
      const moved = Math.min(space, b.portions);
      state.warmer.portions += moved;
      b.portions -= moved;
      if (b.portions <= 0) state.fryer[basket] = { state: 'empty', timer: 0, portions: 0 };
      ctx.emit({ type: 'moved', from: src, to: { kind: 'warmer', index: 0 } });
      return true;
    }
  }
}

function warmerAction(ctx: EngineContext, customer?: number): boolean {
  const { state } = ctx;
  const src: SourceRef = { kind: 'warmer', index: 0 };
  if (state.warmer.portions <= 0) return invalid(ctx, 'No fries ready', src);
  if (!serveItem(ctx, 'fries', src, customer)) return false;
  state.warmer.portions--;
  return true;
}

function cupAction(ctx: EngineContext, slot: number, customer?: number): boolean {
  const { state } = ctx;
  if (!validIndex(state.cups, slot)) return false;
  const c = state.cups[slot];
  const src: SourceRef = { kind: 'cup', index: slot };
  switch (c.state) {
    case 'empty':
      if (!takeFromBin(ctx, 'cup')) return false;
      state.cups[slot] = { state: 'filling', timer: 0 };
      ctx.emit({ type: 'placed', source: src, ingredient: 'cup' });
      return true;
    case 'filling':
      return invalid(ctx, 'Still pouring…', src);
    case 'full':
      if (!serveItem(ctx, 'cola', src, customer)) return false;
      state.cups[slot] = { state: 'empty', timer: 0 };
      return true;
  }
}

function shakerAction(ctx: EngineContext, slot: number, customer?: number): boolean {
  const { state } = ctx;
  if (!validIndex(state.shakers, slot)) return false;
  if (!ctx.level.menu.includes('milkshake')) return invalid(ctx, 'Not on the menu yet');
  const s = state.shakers[slot];
  const src: SourceRef = { kind: 'shaker', index: slot };
  switch (s.state) {
    case 'empty':
      if (!takeFromBin(ctx, 'milk')) return false;
      state.shakers[slot] = { state: 'blending', timer: 0 };
      ctx.emit({ type: 'placed', source: src, ingredient: 'milk' });
      return true;
    case 'blending':
      return invalid(ctx, 'Still blending…', src);
    case 'melted':
      state.shakers[slot] = { state: 'empty', timer: 0 };
      state.stats.wasted++;
      ctx.emit({ type: 'trashed', source: src });
      return true;
    case 'ready':
      if (!serveItem(ctx, 'milkshake', src, customer)) return false;
      state.shakers[slot] = { state: 'empty', timer: 0 };
      return true;
  }
}

function discardAction(ctx: EngineContext, station: DiscardStation, index: number): boolean {
  const { state } = ctx;
  const src = { kind: station, index } as SourceRef;
  switch (station) {
    case 'plate': {
      if (!validIndex(state.plates, index)) return false;
      const p = state.plates[index];
      if (!p.bun && !p.patty && p.toppings.length === 0) return false;
      state.plates[index] = { bun: false, patty: false, toppings: [] };
      break;
    }
    case 'grill':
      if (!validIndex(state.grill, index) || state.grill[index].state === 'empty') return false;
      state.grill[index] = { state: 'empty', timer: 0 };
      break;
    case 'fryer':
      if (!validIndex(state.fryer, index) || state.fryer[index].state === 'empty') return false;
      state.fryer[index] = { state: 'empty', timer: 0, portions: 0 };
      break;
    case 'cup':
      if (!validIndex(state.cups, index) || state.cups[index].state === 'empty') return false;
      state.cups[index] = { state: 'empty', timer: 0 };
      break;
    case 'shaker':
      if (!validIndex(state.shakers, index) || state.shakers[index].state === 'empty') return false;
      state.shakers[index] = { state: 'empty', timer: 0 };
      break;
    default:
      return false;
  }
  state.stats.wasted++;
  ctx.emit({ type: 'trashed', source: src });
  return true;
}

export { TOPPINGS };
