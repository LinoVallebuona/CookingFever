import type {
  CompleteLevelRequest,
  CompleteLevelResponse,
  GameConfigDTO,
  PlayerSettings,
  PlayerStateDTO,
  PurchaseUpgradeResponse,
  StartLevelResponse,
  UpgradeType,
} from '@sizzle/shared';

const BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? '';

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
  }
}

async function request<T>(method: string, path: string, body?: unknown, retries = 0): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${BASE}/api${path}`, {
      method,
      credentials: 'include',
      headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    if (retries > 0) {
      await new Promise((r) => setTimeout(r, 800));
      return request<T>(method, path, body, retries - 1);
    }
    throw new ApiError(0, 'NETWORK', 'Cannot reach the server. Check your connection and try again.');
  }
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) {
    throw new ApiError(res.status, data?.error ?? 'ERROR', data?.message ?? `Request failed (${res.status})`);
  }
  return data as T;
}

export const api = {
  config: () => request<GameConfigDTO>('GET', '/config', undefined, 2),
  me: () => request<PlayerStateDTO>('GET', '/auth/me', undefined, 1),
  guest: () => request<PlayerStateDTO>('POST', '/auth/guest'),
  login: (identifier: string, password: string) => request<PlayerStateDTO>('POST', '/auth/login', { identifier, password }),
  register: (username: string, email: string, password: string) => request<PlayerStateDTO>('POST', '/auth/register', { username, email, password }),
  logout: () => request<{ ok: boolean }>('POST', '/auth/logout'),
  state: () => request<PlayerStateDTO>('GET', '/player/state'),
  saveSettings: (s: PlayerSettings) => request<PlayerSettings>('PUT', '/player/settings', s),
  purchaseUpgrade: (restaurantId: string, upgradeType: UpgradeType) =>
    request<PurchaseUpgradeResponse>('POST', '/player/upgrades/purchase', { restaurantId, upgradeType }),
  startLevel: (restaurantId: string, levelNumber: number) =>
    request<StartLevelResponse>('POST', `/game/restaurants/${restaurantId}/levels/${levelNumber}/start`),
  completeLevel: (sessionId: string, body: CompleteLevelRequest) =>
    request<CompleteLevelResponse>('POST', `/game/sessions/${sessionId}/complete`, body, 2),
  history: () =>
    request<Array<{ id: string; levelNumber: number; levelName: string; status: string; revenue: number; stars: number; coinsAwarded: number; finishedAt: string }>>(
      'GET',
      '/player/history?limit=8',
    ),
};
