import 'dotenv/config';
import { buildApp } from '../src/app';
import { createDb } from '../src/db';
import { loadEnv } from '../src/env';
import { syncGameConfig } from '../src/services/configSync';

export async function createTestApp() {
  const url = process.env.TEST_DATABASE_URL!;
  const env = loadEnv({ NODE_ENV: 'test', DATABASE_URL: url, MIN_REALTIME_FACTOR: 0 });
  const db = createDb(url);
  await db.$executeRawUnsafe(
    'TRUNCATE "GameSession", "PlayerUpgrade", "PlayerLevelProgress", "PlayerRestaurant", "PlayerProfile", "Session", "User", "RestaurantUpgrade", "Level", "Restaurant" CASCADE',
  );
  await syncGameConfig(db);
  const app = await buildApp({ env, db });
  await app.ready();
  return { app, db };
}

export function cookieFrom(res: { headers: Record<string, unknown> }): string {
  const raw = res.headers['set-cookie'];
  const list = Array.isArray(raw) ? raw : [raw as string];
  return list.map((c) => String(c).split(';')[0]).join('; ');
}
