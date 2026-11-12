import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from './generated/prisma/client';

export type Db = PrismaClient;

export function createDb(databaseUrl: string): PrismaClient {
  const adapter = new PrismaPg({ connectionString: databaseUrl });
  return new PrismaClient({ adapter });
}

export { Prisma } from './generated/prisma/client';
