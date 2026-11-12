import { CUSTOMER_TYPES } from '../config/customers';
import type { EngineContext } from './context';
import { generateOrder } from './orders';
import { DT, ENTER_TIME, LEAVE_TIME, type Customer } from './types';

/** Spawns new customers according to the level schedule. */
export function updateSpawning(ctx: EngineContext): void {
  const { state, level, rng, mods } = ctx;
  if (state.spawned >= level.customers || state.time < state.nextSpawnAt) return;
  const free: number[] = [];
  state.seats.forEach((s, i) => s === null && free.push(i));
  if (free.length === 0) return; // waits outside until a spot frees up

  const type = rng.weighted(level.customerTypes);
  const seat = rng.pick(free);
  const patience = level.basePatience * CUSTOMER_TYPES[type].patienceMult * mods.patienceMult;
  const customer: Customer = {
    id: state.spawned,
    type,
    seat,
    order: generateOrder(rng, level, type),
    patience,
    maxPatience: patience,
    phase: 'entering',
    phaseTimer: 0,
    happy: false,
    look: rng.int(0, 1_000_000),
    paid: 0,
    tip: 0,
    arrivedAt: state.time,
  };
  state.customers.push(customer);
  state.seats[seat] = customer.id;
  state.spawned++;
  state.nextSpawnAt = state.time + rng.range(level.spawnInterval[0], level.spawnInterval[1]);
  ctx.emit({ type: 'customerArrived', customer: customer.id });
}

/** Customer "AI": walking in, waiting (losing patience) and leaving. */
export function updateCustomers(ctx: EngineContext): void {
  const { state } = ctx;
  for (const c of state.customers) {
    c.phaseTimer += DT;
    if (c.phase === 'entering') {
      if (c.phaseTimer >= ENTER_TIME) {
        c.phase = 'waiting';
        c.phaseTimer = 0;
        ctx.emit({ type: 'customerOrdered', customer: c.id });
      }
    } else if (c.phase === 'waiting') {
      const before = c.patience / c.maxPatience;
      c.patience -= DT;
      const after = c.patience / c.maxPatience;
      if (before > 0.3 && after <= 0.3) ctx.emit({ type: 'customerImpatient', customer: c.id });
      if (c.patience <= 0) {
        c.patience = 0;
        loseCustomer(ctx, c);
      }
    }
  }
  // Remove customers that finished their leave animation and free their seat.
  for (let i = state.customers.length - 1; i >= 0; i--) {
    const c = state.customers[i];
    if (c.phase === 'leaving' && c.phaseTimer >= LEAVE_TIME) {
      if (state.seats[c.seat] === c.id) state.seats[c.seat] = null;
      state.customers.splice(i, 1);
    }
  }
}

export function loseCustomer(ctx: EngineContext, c: Customer): void {
  const { stats } = ctx.state;
  c.phase = 'leaving';
  c.phaseTimer = 0;
  c.happy = false;
  stats.lost++;
  stats.resolved++;
  stats.combo = 0;
  ctx.emit({ type: 'customerLeft', customer: c.id, seat: c.seat });
}
