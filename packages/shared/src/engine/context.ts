import type { LevelDef } from '../config/levels';
import type { KitchenModifiers } from '../config/upgrades';
import type { Rng } from '../rng';
import type { GameEvent, GameState } from './types';

/** Shared context handed to every engine system. */
export interface EngineContext {
  state: GameState;
  level: LevelDef;
  mods: KitchenModifiers;
  rng: Rng;
  emit(e: GameEvent): void;
}
