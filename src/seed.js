import { query } from './database.js';

export const initialCollectionData = [
  { month: 'Jan', expected: 40000, actual: 38000 },
  { month: 'Feb', expected: 42000, actual: 41000 },
  { month: 'Mar', expected: 45000, actual: 44500 },
  { month: 'Apr', expected: 48000, actual: 46000 },
  { month: 'May', expected: 50000, actual: 49000 },
  { month: 'Jun', expected: 55000, actual: 53000 },
];

export const initialBorrowers = [
  {
    id: '1',
    name: 'Anjali Kumar',
    email: 'anjali@example.com',
    phone: '+94 77 123 4567',
    nic: '199012345678',
    district: 'Yogapuram',
    address: 'Main Road, Yogapuram',
    status: 'active',
    createdAt: '2023-10-15',
  },
  {
    id: '2',
    name: 'Rajesh Raman',
    email: 'rajesh@example.com',
    phone: '+94 71 987 6543',
    nic: '881234567V',
    district: 'Anichchayankullam',
    address: 'Temple Road, Anichchayankullam',
    status: 'active',
    createdAt: '2023-11-20',
  },
  {
    id: '3',
    name: 'Priya Mani',
    email: 'priya@example.com',
    phone: '+94 76 555 4321',
    nic: '951234567V',
    district: 'Vadakaadu',
    address: 'School Lane, Vadakaadu',
    status: 'inactive',
    createdAt: '2023-09-05',
  },
];

export const initialLoans = [
  {
    id: 'L1001',
    borrowerId: '1',
    borrowerName: 'Anjali Kumar',
    amount: 50000,
    interestRate: 12,
    durationMonths: 12,
    startDate: '2024-01-10',
    status: 'active',
    repaymentFrequency: 'monthly',
    remainingBalance: 35000,
  },
  {
    id: 'L1002',
    borrowerId: '2',
    borrowerName: 'Rajesh Raman',
    amount: 100000,
    interestRate: 10,
    durationMonths: 24,
    startDate: '2023-12-01',
    status: 'active',
    repaymentFrequency: 'monthly',
    remainingBalance: 82000,
  },
];

export const initialRepayments = [
  {
    id: 'R2001',
    loanId: 'L1001',
    amount: 4500,
    date: '2024-05-10',
    status: 'paid',
    method: 'mobile_wallet',
    reference: 'MW-10001',
  },
  {
    id: 'R2002',
    loanId: 'L1002',
    amount: 5200,
    date: '2024-05-01',
    status: 'paid',
    method: 'bank_transfer',
    reference: 'BT-20002',
  },
];

export const initialFixedDeposits = [
  {
    id: 'FD3001',
    borrowerId: '1',
    borrowerName: 'Anjali Kumar',
    principalAmount: 500000,
    interestRate: 8.5,
    durationMonths: 12,
    startDate: '2024-01-15',
    maturityDate: '2025-01-15',
    maturityAmount: 542500,
    status: 'active',
  },
  {
    id: 'FD3002',
    borrowerId: '2',
    borrowerName: 'Rajesh Raman',
    principalAmount: 1000000,
    interestRate: 9,
    durationMonths: 24,
    startDate: '2023-06-01',
    maturityDate: '2025-06-01',
    maturityAmount: 1180000,
    status: 'active',
  },
];

export const createInitialDatabase = () => ({
  borrowers: initialBorrowers,
  loans: initialLoans,
  repayments: initialRepayments,
  fixedDeposits: initialFixedDeposits,
  collectionData: initialCollectionData,
  users: [
    {
      id: 'U1',
      name: 'Admin User',
      email: 'admin@vanniloan.com',
      password: 'password123',
      role: 'admin',
    },
  ],
});

export const seedDatabase = async () => {
  await query(`
    INSERT INTO users (id, name, email, password, role)
    VALUES ('U1', 'Admin User', 'admin@vanniloan.com', 'password123', 'admin')
    ON CONFLICT (id) DO NOTHING
  `);

  for (const borrower of initialBorrowers) {
    await query(
      `INSERT INTO borrowers (id, name, email, phone, nic, district, address, status, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       ON CONFLICT (id) DO UPDATE SET
         name = EXCLUDED.name,
         email = EXCLUDED.email,
         phone = EXCLUDED.phone,
         nic = EXCLUDED.nic,
         district = EXCLUDED.district,
         address = EXCLUDED.address,
         status = EXCLUDED.status`,
      [
        borrower.id,
        borrower.name,
        borrower.email,
        borrower.phone,
        borrower.nic,
        borrower.district,
        borrower.address,
        borrower.status,
        borrower.createdAt,
      ],
    );
  }

  for (const loan of initialLoans) {
    await query(
      `INSERT INTO loans (id, borrower_id, amount, interest_rate, duration_months, start_date, status, repayment_frequency, remaining_balance)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       ON CONFLICT (id) DO NOTHING`,
      [loan.id, loan.borrowerId, loan.amount, loan.interestRate, loan.durationMonths, loan.startDate, loan.status, loan.repaymentFrequency, loan.remainingBalance],
    );
  }

  for (const repayment of initialRepayments) {
    await query(
      `INSERT INTO repayments (id, loan_id, amount, payment_date, status, method, reference)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (id) DO UPDATE SET
         method = EXCLUDED.method,
         reference = EXCLUDED.reference`,
      [repayment.id, repayment.loanId, repayment.amount, repayment.date, repayment.status, repayment.method, repayment.reference],
    );
  }

  for (const fd of initialFixedDeposits) {
    await query(
      `INSERT INTO fixed_deposits
        (id, borrower_id, principal_amount, interest_rate, duration_months, start_date, maturity_date, maturity_amount, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       ON CONFLICT (id) DO NOTHING`,
      [
        fd.id,
        fd.borrowerId,
        fd.principalAmount,
        fd.interestRate,
        fd.durationMonths,
        fd.startDate,
        fd.maturityDate,
        fd.maturityAmount,
        fd.status,
      ],
    );
  }

  for (const item of initialCollectionData) {
    await query(
      `INSERT INTO collection_data (month, expected, actual)
       VALUES ($1, $2, $3)
       ON CONFLICT (month) DO NOTHING`,
      [item.month, item.expected, item.actual],
    );
  }

  await query(
    `INSERT INTO settings (key, value) VALUES
      ('profile', $1),
      ('organization', $2),
      ('notifications', $3),
      ('billing', $4)
     ON CONFLICT (key) DO NOTHING`,
    [
      JSON.stringify({ fullName: 'Arun Kumar', email: 'arun@vanniloan.com', phone: '+91 98765 43210', designation: 'Administrator', profilePhoto: null }),
      JSON.stringify({ orgName: 'VanniLoan Finance Ltd.', regNum: 'U65991TN2024PTC123456', taxId: '33AAFCD1234F1Z5', orgAddress: '12, West St, Chennai, Tamil Nadu', currency: 'INR (₹)' }),
      JSON.stringify({ notifyNewLoan: true, notifyRepayment: true, smsAlerts: false, weeklyDigest: true }),
      JSON.stringify({ plan: 'Professional SaaS Dashboard', amount: 4999, status: 'active', renewsOn: '2026-06-01' }),
    ],
  );

  const existingNotifications = await query('SELECT COUNT(*)::int AS count FROM notifications');
  if (existingNotifications.rows[0].count === 0) {
    await query(`
      INSERT INTO notifications (title, message, type, is_unread) VALUES
        ('Repayment Received', 'Anjali Kumar paid Rs. 4,500 for Loan #L1001', 'success', TRUE),
        ('Loan Overdue', 'Loan #L1045 for Rajesh Raman is now 3 days overdue', 'error', TRUE),
        ('New Borrower Registered', 'Priya Mani has completed her profile registration', 'info', FALSE)
    `);
  }
};