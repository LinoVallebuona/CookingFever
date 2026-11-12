import {
  DEFAULT_SETTINGS,
  GamePhase,
  canTransition,
  type CompleteLevelResponse,
  type GameConfigDTO,
  type PlayerSettings,
  type PlayerStateDTO,
  type StartLevelResponse,
  type UpgradeType,
} from '@sizzle/shared';
import { create } from 'zustand';
import { api, ApiError } from '../api/client';
import { audio } from '../audio/AudioManager';

export type Screen = 'boot' | 'auth' | 'menu' | 'restaurants' | 'levels' | 'upgrades' | 'profile' | 'settings' | 'game';

export interface Toast {
  id: number;
  message: string;
  kind: 'info' | 'error' | 'success';
}

interface AppState {
  screen: Screen;
  phase: GamePhase;
  bootError: string | null;
  config: GameConfigDTO | null;
  player: PlayerStateDTO | null;
  settings: PlayerSettings;
  restaurantId: string;
  run: StartLevelResponse | null;
  startingLevel: number | null;
  lastCompletion: CompleteLevelResponse | null;
  toasts: Toast[];

  boot(): Promise<void>;
  go(screen: Screen): void;
  setPhase(phase: GamePhase): void;
  toast(message: string, kind?: Toast['kind']): void;
  dismissToast(id: number): void;
  playAsGuest(): Promise<void>;
  login(identifier: string, password: string): Promise<void>;
  register(username: string, email: string, password: string): Promise<void>;
  logout(): Promise<void>;
  refreshPlayer(): Promise<void>;
  setPlayer(p: PlayerStateDTO): void;
  startLevel(levelNumber: number): Promise<boolean>;
  quitRun(): void;
  setCompletion(c: CompleteLevelResponse | null): void;
  buyUpgrade(type: UpgradeType): Promise<boolean>;
  updateSettings(patch: Partial<PlayerSettings>): void;
}

const SETTINGS_KEY = 'sizzle.settings';
function loadLocalSettings(): PlayerSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) {
      const s = JSON.parse(raw) as PlayerSettings;
      return { ...DEFAULT_SETTINGS, ...s, audio: { ...DEFAULT_SETTINGS.audio, ...s.audio } };
    }
  } catch {
    /* storage unavailable */
  }
  return DEFAULT_SETTINGS;
}
function saveLocalSettings(s: PlayerSettings) {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
  } catch {
    /* ignore */
  }
}

let toastId = 1;
let settingsTimer: ReturnType<typeof setTimeout> | undefined;

const phaseForScreen = (s: Screen): GamePhase => (s === 'levels' ? GamePhase.LEVEL_SELECTION : s === 'game' ? GamePhase.PLAYING : GamePhase.MENU);

export const useApp = create<AppState>((set, get) => ({
  screen: 'boot',
  phase: GamePhase.MENU,
  bootError: null,
  config: null,
  player: null,
  settings: loadLocalSettings(),
  restaurantId: 'diner',
  run: null,
  startingLevel: null,
  lastCompletion: null,
  toasts: [],

  async boot() {
    set({ bootError: null, screen: 'boot' });
    audio.applySettings(get().settings);
    try {
      const config = await api.config();
      set({ config });
    } catch (e) {
      set({ bootError: e instanceof Error ? e.message : 'Could not load the game' });
      return;
    }
    try {
      const player = await api.me();
      get().setPlayer(player);
      set({ screen: 'menu', phase: GamePhase.MENU });
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) set({ screen: 'auth' });
      else set({ bootError: e instanceof Error ? e.message : 'Could not load the game' });
    }
  },

  go(screen) {
    const target = phaseForScreen(screen);
    const { phase } = get();
    if (phase !== target && !canTransition(phase, target) && screen !== 'auth') {
      console.warn(`Unusual phase transition ${phase} -> ${target}`);
    }
    set({ screen, phase: target });
  },

  setPhase(phase) {
    const current = get().phase;
    if (current === phase) return;
    if (!canTransition(current, phase)) console.warn(`Invalid phase transition ${current} -> ${phase}`);
    set({ phase });
  },

  toast(message, kind = 'info') {
    const id = toastId++;
    set((s) => ({ toasts: [...s.toasts.slice(-3), { id, message, kind }] }));
    setTimeout(() => get().dismissToast(id), 3500);
  },
  dismissToast(id) {
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
  },

  setPlayer(player) {
    const settings = player.profile.settings;
    saveLocalSettings(settings);
    audio.applySettings(settings);
    set({ player, settings });
  },

  async playAsGuest() {
    const p = await api.guest();
    get().setPlayer(p);
    get().go('menu');
  },
  async login(identifier, password) {
    const p = await api.login(identifier, password);
    get().setPlayer(p);
    get().go('menu');
    get().toast(`Welcome back, ${p.user.username}!`, 'success');
  },
  async register(username, email, password) {
    const wasGuest = get().player?.user.isGuest;
    const p = await api.register(username, email, password);
    get().setPlayer(p);
    get().go('menu');
    get().toast(wasGuest ? 'Account created – your guest progress was saved!' : `Welcome, ${p.user.username}!`, 'success');
  },
  async logout() {
    try {
      await api.logout();
    } catch {
      /* ignore */
    }
    set({ player: null, run: null, lastCompletion: null, screen: 'auth', phase: GamePhase.MENU });
  },
  async refreshPlayer() {
    try {
      get().setPlayer(await api.state());
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) set({ player: null, screen: 'auth' });
    }
  },

  async startLevel(levelNumber) {
    if (get().startingLevel) return false;
    set({ startingLevel: levelNumber });
    try {
      const run = await api.startLevel(get().restaurantId, levelNumber);
      set({ run, lastCompletion: null, screen: 'game', startingLevel: null });
      get().setPhase(GamePhase.PLAYING);
      return true;
    } catch (e) {
      set({ startingLevel: null });
      get().toast(e instanceof Error ? e.message : 'Could not start the level', 'error');
      return false;
    }
  },
  quitRun() {
    set({ run: null, lastCompletion: null });
    get().go('levels');
    void get().refreshPlayer();
  },
  setCompletion(c) {
    set({ lastCompletion: c });
    if (c) get().setPlayer(c.player);
  },

  async buyUpgrade(type) {
    try {
      const res = await api.purchaseUpgrade(get().restaurantId, type);
      get().setPlayer(res.player);
      return true;
    } catch (e) {
      get().toast(e instanceof Error ? e.message : 'Purchase failed', 'error');
      return false;
    }
  },

  updateSettings(patch) {
    const settings = { ...get().settings, ...patch, audio: { ...get().settings.audio, ...(patch.audio ?? {}) } };
    set({ settings });
    saveLocalSettings(settings);
    audio.applySettings(settings);
    clearTimeout(settingsTimer);
    if (get().player) {
      settingsTimer = setTimeout(() => {
        api.saveSettings(settings).catch(() => get().toast('Settings saved on this device only (offline)', 'error'));
      }, 500);
    }
  },
}));
