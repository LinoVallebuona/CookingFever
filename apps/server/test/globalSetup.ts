import 'dotenv/config';
import { execSync } from 'node:child_process';

/** Applies migrations to the dedicated test database before the suite runs. */
export default function setup() {
  const url = process.env.TEST_DATABASE_URL;
  if (!url) throw new Error('TEST_DATABASE_URL must be set to run server tests (see .env.example)');
  execSync('npx prisma migrate deploy', { stdio: 'inherit', env: { ...process.env, DATABASE_URL: url } });
}
