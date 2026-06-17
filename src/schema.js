export const schemaSql = `
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'admin',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at DATE NOT NULL DEFAULT CURRENT_DATE
);

CREATE TABLE IF NOT EXISTS borrowers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  nic TEXT NOT NULL DEFAULT '',
  district TEXT NOT NULL DEFAULT 'Yogapuram',
  address TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('active', 'inactive')) DEFAULT 'active',
  avatar TEXT,
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  created_at DATE NOT NULL DEFAULT CURRENT_DATE
);

ALTER TABLE borrowers ADD COLUMN IF NOT EXISTS nic TEXT NOT NULL DEFAULT '';
ALTER TABLE borrowers ADD COLUMN IF NOT EXISTS district TEXT NOT NULL DEFAULT 'Yogapuram';
ALTER TABLE borrowers ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN NOT NULL DEFAULT FALSE;
UPDATE borrowers SET nic = '' WHERE nic IS NULL;
UPDATE borrowers SET district = 'Yogapuram' WHERE district IS NULL OR district = '';
ALTER TABLE borrowers ALTER COLUMN nic SET NOT NULL;
ALTER TABLE borrowers ALTER COLUMN district SET NOT NULL;
ALTER TABLE borrowers ALTER COLUMN is_deleted SET NOT NULL;

CREATE TABLE IF NOT EXISTS loans (
  id TEXT PRIMARY KEY,
  borrower_id TEXT NOT NULL REFERENCES borrowers(id) ON UPDATE CASCADE,
  amount NUMERIC(14,2) NOT NULL CHECK (amount > 0),
  interest_rate NUMERIC(8,2) NOT NULL CHECK (interest_rate >= 0),
  duration_months INTEGER NOT NULL CHECK (duration_months > 0),
  start_date DATE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'active', 'completed', 'overdue')) DEFAULT 'active',
  repayment_frequency TEXT NOT NULL CHECK (repayment_frequency IN ('weekly', 'monthly')) DEFAULT 'monthly',
  remaining_balance NUMERIC(14,2) NOT NULL CHECK (remaining_balance >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS repayments (
  id TEXT PRIMARY KEY,
  loan_id TEXT NOT NULL REFERENCES loans(id) ON UPDATE CASCADE,
  amount NUMERIC(14,2) NOT NULL CHECK (amount > 0),
  payment_date DATE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('paid', 'pending', 'failed')) DEFAULT 'paid',
  method TEXT NOT NULL CHECK (method IN ('cash', 'bank_transfer', 'mobile_wallet')),
  reference TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE repayments ADD COLUMN IF NOT EXISTS reference TEXT;
ALTER TABLE repayments DROP CONSTRAINT IF EXISTS repayments_method_check;
UPDATE repayments SET method = 'mobile_wallet' WHERE method = 'upi';
ALTER TABLE repayments ADD CONSTRAINT repayments_method_check CHECK (method IN ('cash', 'bank_transfer', 'mobile_wallet'));

CREATE TABLE IF NOT EXISTS fixed_deposits (
  id TEXT PRIMARY KEY,
  borrower_id TEXT NOT NULL REFERENCES borrowers(id) ON UPDATE CASCADE,
  principal_amount NUMERIC(14,2) NOT NULL CHECK (principal_amount > 0),
  interest_rate NUMERIC(8,2) NOT NULL CHECK (interest_rate >= 0),
  duration_months INTEGER NOT NULL CHECK (duration_months > 0),
  start_date DATE NOT NULL,
  maturity_date DATE NOT NULL,
  maturity_amount NUMERIC(14,2) NOT NULL CHECK (maturity_amount >= 0),
  status TEXT NOT NULL CHECK (status IN ('active', 'matured', 'withdrawn')) DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS collection_data (
  month TEXT PRIMARY KEY,
  expected NUMERIC(14,2) NOT NULL DEFAULT 0,
  actual NUMERIC(14,2) NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL
);

CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('success', 'error', 'info', 'warning')) DEFAULT 'info',
  is_unread BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
ALTER TABLE notifications ADD CONSTRAINT notifications_type_check CHECK (type IN ('success', 'error', 'info', 'warning'));

CREATE TABLE IF NOT EXISTS password_reset_requests (
  id SERIAL PRIMARY KEY,
  email TEXT NOT NULL,
  token TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_borrowers_deleted ON borrowers(is_deleted);
CREATE INDEX IF NOT EXISTS idx_loans_borrower_id ON loans(borrower_id);
CREATE INDEX IF NOT EXISTS idx_repayments_loan_id ON repayments(loan_id);
CREATE INDEX IF NOT EXISTS idx_fixed_deposits_borrower_id ON fixed_deposits(borrower_id);
`;