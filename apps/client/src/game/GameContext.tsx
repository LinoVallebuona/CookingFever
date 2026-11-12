import { DINER_LEVELS, MENU, type GameState, type IngredientId, type KitchenModifiers, type LevelDef, type MenuItemId } from '@sizzle/shared';
import { createContext, useContext } from 'react';
import type { GameController } from './GameController';
import type { PointerSource } from './input';

export interface GameCtx {
  controller: GameController;
  state: GameState;
  level: LevelDef;
  mods: KitchenModifiers;
  onPointerDown(e: React.PointerEvent, src: PointerSource): void;
  reducedMotion: boolean;
}

export const GameContext = createContext<GameCtx | null>(null);

export function useGame(): GameCtx {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame outside GameContext');
  return ctx;
}

/** First level whose menu uses the given ingredient / item (for "unlocks at" labels). */
export function unlockLevelForIngredient(id: IngredientId): number {
  return DINER_LEVELS.find((l) => l.menu.some((m) => MENU[m].ingredients.includes(id)))?.number ?? 1;
}
export function unlockLevelForItem(id: MenuItemId): number {
  return DINER_LEVELS.find((l) => l.menu.includes(id))?.number ?? 1;
}
