import type { Config } from 'drizzle-kit';

export default {
  schema: './lib/schema/*',
  out: './database/migrations',
  dialect: 'sqlite',
  dbCredentials: {
    url: './database/epapercms.db',
  },
} satisfies Config;