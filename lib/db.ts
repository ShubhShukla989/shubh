import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { validateEnvOrThrow } from './validateEnv';

// Validate environment variables before initializing database
validateEnvOrThrow();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL!,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

export const db = drizzle(pool);
