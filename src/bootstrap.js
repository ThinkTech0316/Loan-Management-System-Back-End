import pg from 'pg';
import { config } from './config.js';

const ensureDatabaseExists = async () => {
  const url = new URL(config.databaseUrl);
  const databaseName = url.pathname.replace(/^\//, '');
  if (!databaseName) return;

  // Connect to the default 'postgres' database to create our database
  const adminUrl = new URL(config.databaseUrl);
  adminUrl.pathname = '/postgres';

  const client = new pg.Client({ connectionString: adminUrl.toString() });
  try {
    await client.connect();
    const res = await client.query(
      'SELECT datname FROM pg_database WHERE datname = $1',
      [databaseName],
    );
    if (res.rows.length === 0) {
      await client.query(`CREATE DATABASE "${databaseName}"`);
      console.log(`[Bootstrap] Created PostgreSQL database "${databaseName}".`);
    }
  } finally {
    await client.end();
  }
};

export const bootstrapDatabase = async () => {
  try {
    await ensureDatabaseExists();

    const { query } = await import('./database.js');
    const { schemaSql } = await import('./schema.js');
    const { seedDatabase } = await import('./seed.js');

    // PostgreSQL doesn't support multiple statements in one query,
    // so we split and execute each CREATE TABLE separately
    const statements = schemaSql
      .split(';')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    for (const stmt of statements) {
      await query(stmt);
    }

    // Create indexes safely (ignore if already exist)
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_borrowers_deleted ON borrowers(is_deleted)',
      'CREATE INDEX IF NOT EXISTS idx_loans_borrower_id ON loans(borrower_id)',
      'CREATE INDEX IF NOT EXISTS idx_repayments_loan_id ON repayments(loan_id)',
      'CREATE INDEX IF NOT EXISTS idx_fixed_deposits_borrower_id ON fixed_deposits(borrower_id)',
    ];
    for (const sql of indexes) {
      try { await query(sql); } catch (e) { /* ignore */ }
    }

    await seedDatabase();
    console.log('[Bootstrap] Database schema and seed data ready.');
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.error('[Bootstrap] Could not connect to PostgreSQL. Start PostgreSQL or update DATABASE_URL in .env.');
    }
    throw error;
  }
};
