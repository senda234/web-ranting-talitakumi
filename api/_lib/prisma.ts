import { PrismaClient } from '@prisma/client';

declare global {
  // allow global `var` declarations
  var prismaGlobal: PrismaClient | undefined;
}

const DEFAULT_DATABASE_URL =
  'postgresql://neondb_owner:npg_gBNvG0FVP8Oa@ep-winter-recipe-b337iax8-pooler.c-4.ap-southeast-1.aws.neon.tech/talitakumi?sslmode=require';

const effectiveDbUrl = process.env.DATABASE_URL || DEFAULT_DATABASE_URL;

// Pastikan DATABASE_URL selalu tersedia
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = effectiveDbUrl;
}

export const prisma =
  globalThis.prismaGlobal ||
  new PrismaClient({
    datasources: {
      db: {
        url: effectiveDbUrl,
      },
    },
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalThis.prismaGlobal = prisma;
}

export default prisma;
