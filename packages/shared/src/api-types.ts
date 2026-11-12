/** DTOs exchanged between the client and the REST API. */
import type { LevelDef } from './config/levels';
import type { RestaurantDef } from './config/restaurants';
import type { UpgradeLevels, UpgradeType } from './config/upgrades';
import type { GameResult, RecordedAction } from './engine/types';
import type { LevelReward } from './rewards';

export interface UserDTO {
  id: string;
  username: string;
  email: string | null;
  isGuest: boolean;
  createdAt: string;
}

export interface AudioSettings {
  master: number;
  music: boolean;
  sfx: boolean;
  voices: boolean;
  ui: boolean;
}

export interface PlayerSettings {
  audio: AudioSettings;
  showHints: boolean;
  reducedMotion: boolean;
}

export const DEFAULT_SETTINGS: PlayerSettings = {
  audio: { master: 0.8, music: true, sfx: true, voices: true, ui: true },
  showHints: true,
  reducedMotion: false,
};

export interface PlayerStatsDTO {
  totalCoinsEarned: number;
  totalCustomersServed: number;
  totalCustomersLost: number;
  totalGamesPlayed: number;
  bestCombo: number;
}

export interface ProfileDTO {
  coins: number;
  totalStars: number;
  totalLevelsCompleted: number;
  stats: PlayerStatsDTO;
  settings: PlayerSettings;
}

export interface LevelProgressDTO {
  levelNumber: number;
  bestStars: number;
  bestRevenue: number;
  completed: boolean;
  attempts: number;
  unlocked: boolean;
}

export interface RestaurantProgressDTO {
  restaurant: RestaurantDef;
  unlocked: boolean;
  levels: LevelProgressDTO[];
  upgrades: UpgradeLevels;
  stars: number;
}

export interface PlayerStateDTO {
  user: UserDTO;
  profile: ProfileDTO;
  restaurants: RestaurantProgressDTO[];
}

export interface GameConfigDTO {
  restaurants: RestaurantDef[];
  levels: Record<string, LevelDef[]>;
  upgradeCosts: Record<string, Record<UpgradeType, number[]>>;
}

export interface StartLevelResponse {
  sessionId: string;
  seed: number;
  level: LevelDef;
  upgrades: UpgradeLevels;
}

export interface CompleteLevelRequest {
  actions: RecordedAction[];
  /** Client's own result – only used for mismatch logging, never trusted. */
  clientResult?: { revenue: number; stars: number };
}

export interface CompleteLevelResponse {
  result: GameResult;
  reward: LevelReward;
  newlyUnlockedLevel: number | null;
  player: PlayerStateDTO;
}

export interface PurchaseUpgradeResponse {
  upgradeType: UpgradeType;
  newLevel: number;
  cost: number;
  player: PlayerStateDTO;
}

export interface ApiErrorBody {
  error: string;
  message: string;
  details?: unknown;
}
