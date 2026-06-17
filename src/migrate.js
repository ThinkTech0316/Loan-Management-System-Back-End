import pg from 'pg';
import { config } from './config.js';
import { pool, query } from './database.js';
import { schemaSql } from './schema.js';
import { seedDatabase } from './seed.js';

const { Pool } = pg;

const quoteIdentifier = (identifier) => `"${identifier.replaceAll('"', '""')}"`;

const ensureDatabaseExists = async () => {
  const databaseUrl = new URL(config.databaseUrl);
  const databaseName = databaseUrl.pathname.replace(/^\//, '');
  if (!databaseName || databaseName === 'postgres') return;

  const adminUrl = new URL(config.databaseUrl);
  adminUrl.pathname = '/postgres';

  const adminPool = new Pool({ connectionString: adminUrl.toString() });
  try {
    const existing = await adminPool.query('SELECT 1 FROM pg_database WHERE datname = $1', [databaseName]);
    if (existing.rowCount === 0) {
      await adminPool.query(`CREATE DATABASE ${quoteIdentifier(databaseName)}`);
      console.log(`Created PostgreSQL database "${databaseName}".`);
    }
  } finally {
    await adminPool.end();
  }
};

try {
  await ensureDatabaseExists();
  await query(schemaSql);
  await seedDatabase();
  console.log('PostgreSQL schema initialized and seed data applied.');
} catch (error) {
  if (error.code === 'ECONNREFUSED') {
    console.error('Could not connect to PostgreSQL. Start PostgreSQL or update DATABASE_URL in .env, then run npm run db:init again.');
  }
  throw error;
} finally {
  await pool.end();
}