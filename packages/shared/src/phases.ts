/** Top-level game state machine phases (shared between UI and docs). */
export const GamePhase = {
  MENU: 'MENU',
  LEVEL_SELECTION: 'LEVEL_SELECTION',
  PLAYING: 'PLAYING',
  PAUSED: 'PAUSED',
  LEVEL_COMPLETED: 'LEVEL_COMPLETED',
  LEVEL_FAILED: 'LEVEL_FAILED',
} as const;
export type GamePhase = (typeof GamePhase)[keyof typeof GamePhase];

/** Allowed transitions – used by the client store and covered by tests. */
export const PHASE_TRANSITIONS: Record<GamePhase, GamePhase[]> = {
  MENU: ['LEVEL_SELECTION', 'MENU'],
  LEVEL_SELECTION: ['MENU', 'PLAYING', 'LEVEL_SELECTION'],
  PLAYING: ['PAUSED', 'LEVEL_COMPLETED', 'LEVEL_FAILED', 'LEVEL_SELECTION'],
  PAUSED: ['PLAYING', 'LEVEL_SELECTION', 'MENU'],
  LEVEL_COMPLETED: ['LEVEL_SELECTION', 'PLAYING', 'MENU'],
  LEVEL_FAILED: ['LEVEL_SELECTION', 'PLAYING', 'MENU'],
};

export function canTransition(from: GamePhase, to: GamePhase): boolean {
  return PHASE_TRANSITIONS[from].includes(to);
}
