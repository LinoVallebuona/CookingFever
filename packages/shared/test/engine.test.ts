import { describe, expect, it } from 'vitest';
import {
  DINER_LEVELS,
  GameEngine,
  Rng,
  TICK_RATE,
  computeKitchenModifiers,
  emptyUpgradeLevels,
  generateOrder,
  replayGame,
  type LevelDef,
} from '../src';
import { playWithBot } from '../src/bot';

const L = (n: number) => DINER_LEVELS[n - 1];

function run(engine: GameEngine, seconds: number) {
  const ticks = Math.round(seconds * TICK_RATE);
  for (let i = 0; i < ticks && !engine.finished; i++) engine.step();
}

/** A level with no customers – handy for testing stations in isolation. */
function quietLevel(base: LevelDef = L(20)): LevelDef {
  return { ...base, customers: 1, firstSpawnDelay: 9999 };
}

describe('Rng', () => {
  it('is deterministic for the same seed', () => {
    const a = new Rng(42);
    const b = new Rng(42);
    for (let i = 0; i < 100; i++) expect(a.next()).toBe(b.next());
  });
  it('produces values in range', () => {
    const r = new Rng(1);
    for (let i = 0; i < 1000; i++) {
      const v = r.int(2, 5);
      expect(v).toBeGreaterThanOrEqual(2);
      expect(v).toBeLessThanOrEqual(5);
    }
  });
});

describe('Grill', () => {
  it('cooks a patty and burns it if left too long', () => {
    const e = GameEngine.create(quietLevel(), emptyUpgradeLevels(), 1);
    const mods = e.mods;
    expect(e.dispatch({ type: 'bin', bin: 'patty' })).toBe(true);
    expect(e.state.grill[0].state).toBe('raw');
    expect(e.state.bins.patty.stock).toBe(mods.binStock.patty - 1);
    run(e, mods.pattyCookTime + 0.05);
    expect(e.state.grill[0].state).toBe('cooked');
    run(e, mods.pattyBurnTime);
    expect(e.state.grill[0].state).toBe('burnt');
    // tapping a burnt patty throws it away
    expect(e.dispatch({ type: 'grill', slot: 0 })).toBe(true);
    expect(e.state.grill[0].state).toBe('empty');
    expect(e.state.stats.wasted).toBe(1);
  });

  it('grill speed upgrade shortens cooking time', () => {
    const base = computeKitchenModifiers(emptyUpgradeLevels());
    const fast = computeKitchenModifiers({ grillSpeed: 3 });
    expect(fast.pattyCookTime).toBeLessThan(base.pattyCookTime);
    expect(fast.pattyBurnTime).toBeGreaterThan(base.pattyBurnTime);
  });

  it('refuses to move a patty when no bun is on a plate', () => {
    const e = GameEngine.create(quietLevel(), emptyUpgradeLevels(), 1, true);
    e.dispatch({ type: 'bin', bin: 'patty' });
    run(e, e.mods.pattyCookTime + 0.1);
    expect(e.dispatch({ type: 'grill', slot: 0 })).toBe(false);
    expect(e.drainEvents().some((ev) => ev.type === 'invalid')).toBe(true);
  });
});

describe('Burger assembly', () => {
  it('builds a deluxe burger on a specific plate', () => {
    const e = GameEngine.create(quietLevel(), emptyUpgradeLevels(), 1);
    e.dispatch({ type: 'bin', bin: 'bun', plate: 1 });
    expect(e.state.plates[1].bun).toBe(true);
    expect(e.state.plates[0].bun).toBe(false);
    e.dispatch({ type: 'bin', bin: 'patty' });
    run(e, e.mods.pattyCookTime + 0.1);
    expect(e.dispatch({ type: 'grill', slot: 0, plate: 1 })).toBe(true);
    e.dispatch({ type: 'bin', bin: 'cheese', plate: 1 });
    e.dispatch({ type: 'bin', bin: 'lettuce', plate: 1 });
    e.dispatch({ type: 'bin', bin: 'tomato', plate: 1 });
    expect(e.state.plates[1]).toEqual({ bun: true, patty: true, toppings: ['cheese', 'lettuce', 'tomato'] });
    // duplicate topping is rejected
    expect(e.dispatch({ type: 'bin', bin: 'cheese', plate: 1 })).toBe(false);
  });

  it('cannot serve a burger nobody ordered', () => {
    const e = GameEngine.create(quietLevel(), emptyUpgradeLevels(), 1);
    e.dispatch({ type: 'plate', plate: 0 }); // tap empty plate -> bun
    expect(e.state.plates[0].bun).toBe(true);
    expect(e.dispatch({ type: 'plate', plate: 0 })).toBe(false); // no patty
  });

  it('can discard a plate', () => {
    const e = GameEngine.create(quietLevel(), emptyUpgradeLevels(), 1);
    e.dispatch({ type: 'bin', bin: 'bun' });
    e.dispatch({ type: 'bin', bin: 'cheese' });
    expect(e.dispatch({ type: 'discard', station: 'plate', index: 0 })).toBe(true);
    expect(e.state.plates[0]).toEqual({ bun: false, patty: false, toppings: [] });
  });
});

describe('Fryer, drinks and shakes', () => {
  it('fries potatoes into the warmer and burns them if ignored', () => {
    const e = GameEngine.create(quietLevel(), emptyUpgradeLevels(), 1);
    e.dispatch({ type: 'fryer', basket: 0 });
    expect(e.state.fryer[0].state).toBe('frying');
    run(e, e.mods.friesCookTime + 0.05);
    expect(e.state.fryer[0].state).toBe('done');
    e.dispatch({ type: 'fryer', basket: 0 });
    expect(e.state.warmer.portions).toBe(e.mods.friesPerBatch);
    expect(e.state.fryer[0].state).toBe('empty');
    e.dispatch({ type: 'fryer', basket: 0 });
    run(e, e.mods.friesCookTime + e.mods.friesBurnTime + 0.1);
    expect(e.state.fryer[0].state).toBe('burnt');
  });

  it('only moves as many portions as fit in the warmer', () => {
    const e = GameEngine.create(quietLevel(), emptyUpgradeLevels(), 1);
    for (let k = 0; k < 2; k++) {
      e.dispatch({ type: 'fryer', basket: 0 });
      run(e, e.mods.friesCookTime + 0.05);
      e.dispatch({ type: 'fryer', basket: 0 });
    }
    expect(e.state.warmer.portions).toBe(e.state.warmer.capacity);
    expect(e.state.fryer[0].state).toBe('done');
    expect(e.state.fryer[0].portions).toBe(2 * e.mods.friesPerBatch - e.state.warmer.capacity);
  });

  it('fills soda cups', () => {
    const e = GameEngine.create(quietLevel(), emptyUpgradeLevels(), 1);
    e.dispatch({ type: 'cup', slot: 1 });
    expect(e.state.cups[1].state).toBe('filling');
    run(e, e.mods.drinkFillTime + 0.05);
    expect(e.state.cups[1].state).toBe('full');
  });

  it('melts milkshakes left too long', () => {
    const e = GameEngine.create(quietLevel(), emptyUpgradeLevels(), 1);
    e.dispatch({ type: 'shaker', slot: 0 });
    run(e, e.mods.shakeBlendTime + 0.05);
    expect(e.state.shakers[0].state).toBe('ready');
    run(e, e.mods.shakeMeltTime);
    expect(e.state.shakers[0].state).toBe('melted');
  });

  it('rejects milkshakes before they are on the menu', () => {
    const e = GameEngine.create(quietLevel(L(1)), emptyUpgradeLevels(), 1);
    expect(e.dispatch({ type: 'shaker', slot: 0 })).toBe(false);
  });
});

describe('Ingredient bins', () => {
  it('requires restocking when empty', () => {
    const e = GameEngine.create(quietLevel(), emptyUpgradeLevels(), 1);
    const max = e.state.bins.cup.max;
    for (let i = 0; i < max; i++) {
      e.dispatch({ type: 'cup', slot: 0 });
      run(e, e.mods.drinkFillTime + 0.05);
      e.dispatch({ type: 'discard', station: 'cup', index: 0 });
    }
    expect(e.state.bins.cup.stock).toBe(0);
    expect(e.dispatch({ type: 'cup', slot: 0 })).toBe(false); // starts restock
    expect(e.state.bins.cup.restocking).toBeGreaterThan(0);
    run(e, e.mods.restockTime + 0.05);
    expect(e.state.bins.cup.stock).toBe(max);
  });

  it('pantry upgrade increases bin size', () => {
    expect(computeKitchenModifiers({ startingStock: 2 }).binStock.patty).toBeGreaterThan(computeKitchenModifiers({}).binStock.patty);
  });
});

describe('Customers', () => {
  it('arrive, order and leave angry when patience runs out', () => {
    const e = GameEngine.create(L(1), emptyUpgradeLevels(), 5, true);
    run(e, L(1).firstSpawnDelay + 1.2);
    expect(e.state.customers.length).toBe(1);
    const c = e.state.customers[0];
    expect(c.phase).toBe('waiting');
    expect(c.order.length).toBeGreaterThan(0);
    run(e, c.maxPatience + 0.5);
    expect(e.state.stats.lost).toBeGreaterThanOrEqual(1);
    expect(e.drainEvents().some((ev) => ev.type === 'customerLeft')).toBe(true);
  });

  it('pay with a tip when fully served', () => {
    const e = GameEngine.create(L(1), emptyUpgradeLevels(), 5);
    playWithBot(e, 20);
    const r = e.result();
    expect(r.served).toBe(L(1).customers);
    expect(r.tips).toBeGreaterThan(0);
    expect(r.revenue).toBe(r.sales + r.tips + r.comboBonus);
  });

  it('patience upgrade gives customers more patience', () => {
    const a = GameEngine.create(L(1), emptyUpgradeLevels(), 9);
    const b = GameEngine.create(L(1), { patience: 5 }, 9);
    run(a, 3);
    run(b, 3);
    expect(b.state.customers[0].maxPatience).toBeGreaterThan(a.state.customers[0].maxPatience);
  });

  it('orders respect level menu and size limits', () => {
    const rng = new Rng(3);
    for (const level of DINER_LEVELS) {
      for (let i = 0; i < 50; i++) {
        const order = generateOrder(rng, level, 'bigEater');
        expect(order.length).toBeGreaterThan(0);
        expect(order.length).toBeLessThanOrEqual(level.maxItemsPerOrder);
        for (const o of order) expect(level.menu).toContain(o.item);
      }
    }
  });

  it('ends the level when the timer runs out', () => {
    const e = GameEngine.create(L(1), emptyUpgradeLevels(), 3);
    run(e, L(1).duration + 1);
    expect(e.finished).toBe(true);
    const r = e.result();
    expect(r.passed).toBe(false);
    expect(r.stars).toBe(0);
  });
});

describe('Deterministic replay (server validation)', () => {
  it('replaying recorded actions reproduces the exact result', () => {
    for (const n of [1, 5, 9, 13, 20]) {
      const e = GameEngine.create(L(n), { grillSpeed: 2 }, 1234 + n);
      playWithBot(e, 25);
      const live = e.result();
      const replay = replayGame(L(n), { grillSpeed: 2 }, 1234 + n, e.actions);
      expect(replay.ok).toBe(true);
      expect(replay.result).toEqual(live);
    }
  });

  it('a different seed or upgrade set does not reproduce the result', () => {
    const e = GameEngine.create(L(6), {}, 77);
    playWithBot(e, 25);
    const live = e.result();
    const other = replayGame(L(6), {}, 78, e.actions);
    expect(other.result?.revenue).not.toBe(live.revenue);
  });

  it('rejects out-of-order actions', () => {
    const out = replayGame(L(1), {}, 1, [
      { t: 10, a: { type: 'bin', bin: 'patty' } },
      { t: 5, a: { type: 'bin', bin: 'bun' } },
    ]);
    expect(out.ok).toBe(false);
  });

  it('rejects actions after the level ended', () => {
    const out = replayGame(L(1), {}, 1, [{ t: 10_000_000, a: { type: 'bin', bin: 'patty' } }]);
    expect(out.ok).toBe(false);
  });
});
