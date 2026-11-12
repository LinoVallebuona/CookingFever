/**
 * Seeds game content (restaurants, 20 diner levels, upgrade tiers) and a demo
 * account. Safe to run multiple times.
 *
 *   npm run db:seed
 *
 * Demo login: demo / demo1234
 */
import 'dotenv/config';
import { createDb } from '../src/db';
import { hashPassword } from '../src/lib/crypto';
import { syncGameConfig } from '../src/services/configSync';
import { ensureProfile } from '../src/services/playerService';

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is not set');
  const db = createDb(url);
  const synced = await syncGameConfig(db);
  console.log(`Synced ${synced.restaurants} restaurants, ${synced.levels} levels, ${synced.upgrades} upgrade tiers.`);

  const existing = await db.user.findUnique({ where: { username: 'demo' } });
  if (!existing) {
    const user = await db.user.create({
      data: { username: 'demo', email: 'demo@sizzle.local', passwordHash: await hashPassword('demo1234') },
    });
    await ensureProfile(db, user.id);
    console.log('Created demo account (demo / demo1234).');
  } else {
    console.log('Demo account already exists.');
  }
  await db.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
