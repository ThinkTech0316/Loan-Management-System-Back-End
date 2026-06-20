import pg from 'pg';
import { config } from './config.js';

export const pool = new pg.Pool({ connectionString: config.databaseUrl });

export const query = async (text, params = []) => {
  const result = await pool.query(text, params);
  return {
    rows: result.rows ?? [],
    rowCount: result.rowCount ?? 0,
  };
};

export const transaction = async (callback) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const wrapped = {
      query: async (text, params = []) => {
        const result = await client.query(text, params);
        return {
          rows: result.rows ?? [],
          rowCount: result.rowCount ?? 0,
        };
      },
    };
    const result = await callback(wrapped);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

export const closeDatabase = () => pool.end();
