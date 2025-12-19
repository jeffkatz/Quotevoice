export const SCHEMA = `
-- 1. SETTINGS
CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
);

-- 2. CLIENTS
CREATE TABLE IF NOT EXISTS clients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    address TEXT,
    tax_id TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 3. INVOICES
CREATE TABLE IF NOT EXISTS invoices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_id INTEGER NOT NULL,
    invoice_number TEXT NOT NULL UNIQUE,
    invoice_name TEXT,
    type TEXT CHECK(type IN ('invoice', 'quotation')) NOT NULL,
    status TEXT CHECK(status IN ('draft', 'sent', 'paid', 'partially_paid', 'void', 'overdue')) NOT NULL,
    issue_date DATE NOT NULL,
    due_date DATE,
    subtotal REAL DEFAULT 0,
    tax_rate REAL DEFAULT 0,
    tax_total REAL DEFAULT 0,
    grand_total REAL DEFAULT 0,
    amount_paid REAL DEFAULT 0,
    balance_due REAL DEFAULT 0,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    design_config TEXT,
    FOREIGN KEY(client_id) REFERENCES clients(id) ON DELETE RESTRICT
);

-- 4. INVOICE ITEMS
CREATE TABLE IF NOT EXISTS invoice_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    invoice_id INTEGER NOT NULL,
    description TEXT NOT NULL,
    quantity REAL NOT NULL,
    unit_price REAL NOT NULL,
    total REAL NOT NULL,
    FOREIGN KEY(invoice_id) REFERENCES invoices(id) ON DELETE CASCADE
);

-- 5. PAYMENTS
CREATE TABLE IF NOT EXISTS payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    invoice_id INTEGER NOT NULL,
    amount REAL NOT NULL,
    date DATE NOT NULL,
    method TEXT,
    reference TEXT,
    notes TEXT,
    FOREIGN KEY(invoice_id) REFERENCES invoices(id) ON DELETE CASCADE
);
`;
