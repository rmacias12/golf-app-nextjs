import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

// Check for DATABASE_URL environment variable
if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set');
}

// Create Neon SQL client
const sql = neon(process.env.DATABASE_URL);

// Create Drizzle database instance with schema
export const db = drizzle({ client: sql, schema });

// Export schema for use in queries
export * from './schema';

// Type exports for TypeScript support
export type DbClient = typeof db;
