import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function cleanDatabase(): Promise<void> {
  const tablenames = await prisma.$queryRaw<
    Array<{ tablename: string }>
  >`SELECT tablename FROM pg_tables WHERE schemaname='public'`;

  const tables = tablenames
    .map(({ tablename }) => tablename)
    .filter((name) => name !== '_prisma_migrations')
    .map((name) => `"public"."${name}"`)
    .join(', ');

  if (tables.length > 0) {
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${tables} CASCADE;`);
  }
}

export async function disconnectDatabase(): Promise<void> {
  await prisma.$disconnect();
}

export { prisma };
