import type { Config } from 'drizzle-kit';

export default {
  schema: './src/db/schema/index.ts',
  out: './drizzle',
  dialect: 'postgresql', // Changed driver to dialect and specified 'postgresql'
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
} satisfies Config;