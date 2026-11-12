import { buildApp } from './app';
import { createDb } from './db';
import { loadEnv } from './env';
import { syncGameConfig } from './services/configSync';

async function main() {
  const env = loadEnv();
  const db = createDb(env.DATABASE_URL);
  const app = await buildApp({ env, db });

  try {
    const synced = await syncGameConfig(db);
    app.log.info(synced, 'game config synced');
  } catch (err) {
    app.log.error({ err }, 'Could not sync game config – is the database running and migrated? (npm run db:deploy)');
    process.exit(1);
  }

  const shutdown = async (signal: string) => {
    app.log.info({ signal }, 'shutting down');
    await app.close();
    await db.$disconnect();
    process.exit(0);
  };
  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));

  await app.listen({ port: env.PORT, host: env.HOST });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
