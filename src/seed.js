import bcrypt from 'bcryptjs';
import { query } from './database.js';

export const seedDatabase = async () => {
  // Hash the admin password with bcrypt before storing
  const hashedPassword = await bcrypt.hash('password123', 10);

  await query(
    `INSERT INTO users (id, name, email, password, role)
     VALUES ('U1', 'Admin User', 'admin@vanniloan.com', $1, 'admin')
     ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, password = EXCLUDED.password`,
    [hashedPassword],
  );
};
