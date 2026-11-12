import type { LevelDef } from '../config/levels';
import type { UpgradeLevels } from '../config/upgrades';
import { GameEngine } from './GameEngine';
import { TICK_RATE, type GameResult, type RecordedAction } from './types';

export interface ReplayOutcome {
  ok: boolean;
  error?: string;
  result?: GameResult;
}

/**
 * Re-simulates a run from its seed and recorded actions.
 * Used by the server to compute the authoritative result of a level.
 */
export function replayGame(
  level: LevelDef,
  upgrades: Partial<UpgradeLevels>,
  seed: number,
  actions: RecordedAction[],
): ReplayOutcome {
  const engine = GameEngine.create(level, upgrades, seed, false);
  const maxTicks = Math.ceil(level.duration * TICK_RATE) + 2;
  let i = 0;
  let lastT = 0;
  for (const a of actions) {
    if (!Number.isInteger(a.t) || a.t < 0 || a.t < lastT) return { ok: false, error: 'Actions are not in chronological order' };
    lastT = a.t;
  }
  while (!engine.finished && engine.state.tick <= maxTicks) {
    while (i < actions.length && actions[i].t === engine.state.tick) {
      engine.dispatch(actions[i].a);
      i++;
    }
    engine.step();
  }
  if (!engine.finished) return { ok: false, error: 'Level did not finish' };
  if (i < actions.length) return { ok: false, error: 'Actions recorded after the level ended' };
  return { ok: true, result: engine.result() };
}
