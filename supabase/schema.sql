-- ============================================================
-- CAMLEASE - Schema Supabase
-- Chạy toàn bộ file này trong Supabase SQL Editor
-- Dashboard → SQL Editor → New query → Paste → Run
-- ============================================================

-- ── 1. Bảng cameras (thiết bị cho thuê) ──────────────────────
CREATE TABLE IF NOT EXISTS cameras (
  id              TEXT PRIMARY KEY,
  name            TEXT NOT NULL,
  short_name      TEXT,
  category        TEXT CHECK (category IN ('Body','Lens','Combo','Accessory')),
  daily_rate      INTEGER NOT NULL DEFAULT 0,
  price_6hours    INTEGER,
  price_1day      INTEGER,
  price_2days     INTEGER,
  price_3days     INTEGER,
  price_4days_plus INTEGER,
  status          TEXT NOT NULL DEFAULT 'Available'
                    CHECK (status IN ('Available','Rented','Maintenance')),
  serial_number   TEXT,
  image           TEXT,
  description     TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 2. Bảng customers (khách hàng) ───────────────────────────
CREATE TABLE IF NOT EXISTS customers (
  id           TEXT PRIMARY KEY,
  name         TEXT NOT NULL,
  phone        TEXT,
  email        TEXT,
  address      TEXT,
  id_number    TEXT,
  trust_level  TEXT NOT NULL DEFAULT 'Medium'
                 CHECK (trust_level IN ('High','Medium','Low')),
  rental_count INTEGER NOT NULL DEFAULT 0,
  notes        TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 3. Bảng contracts (hợp đồng cho thuê) ────────────────────
CREATE TABLE IF NOT EXISTS contracts (
  id                TEXT PRIMARY KEY,
  contract_code     TEXT UNIQUE NOT NULL,
  customer_id       TEXT,
  customer_name     TEXT NOT NULL,
  customer_phone    TEXT,
  customer_doc_type TEXT,
  customer_doc_note TEXT,
  items             JSONB NOT NULL DEFAULT '[]',
  start_date        DATE NOT NULL,
  end_date          DATE NOT NULL,
  is_6hours         BOOLEAN NOT NULL DEFAULT FALSE,
  return_time       TEXT,
  total_price       INTEGER NOT NULL DEFAULT 0,
  paid_amount       INTEGER NOT NULL DEFAULT 0,
  deposit_amount    INTEGER NOT NULL DEFAULT 0,
  status            TEXT NOT NULL DEFAULT 'Pending'
                      CHECK (status IN ('Pending','Active','Completed','Overdue','Cancelled')),
  note              TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 4. Bảng expenses (chi phí vận hành) ──────────────────────
CREATE TABLE IF NOT EXISTS expenses (
  id          TEXT PRIMARY KEY,
  description TEXT NOT NULL,
  amount      INTEGER NOT NULL DEFAULT 0,
  date        DATE NOT NULL,
  category    TEXT CHECK (category IN ('Maintenance','Equipment','Marketing','Utilities','Rent','Other')),
  operator    TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- Row Level Security (RLS)
-- App nội bộ: cho phép anon key đọc/ghi tự do
-- ============================================================

ALTER TABLE cameras   ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses  ENABLE ROW LEVEL SECURITY;

-- Drop cũ nếu tồn tại để tránh lỗi khi chạy lại
DROP POLICY IF EXISTS "Allow all for anon" ON cameras;
DROP POLICY IF EXISTS "Allow all for anon" ON customers;
DROP POLICY IF EXISTS "Allow all for anon" ON contracts;
DROP POLICY IF EXISTS "Allow all for anon" ON expenses;

CREATE POLICY "Allow all for anon" ON cameras   FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON customers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON contracts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON expenses  FOR ALL USING (true) WITH CHECK (true);

-- ============================================================
-- Index tối ưu truy vấn
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_contracts_status     ON contracts(status);
CREATE INDEX IF NOT EXISTS idx_contracts_start_date ON contracts(start_date);
CREATE INDEX IF NOT EXISTS idx_contracts_end_date   ON contracts(end_date);
CREATE INDEX IF NOT EXISTS idx_cameras_status       ON cameras(status);
CREATE INDEX IF NOT EXISTS idx_expenses_date        ON expenses(date);

-- ============================================================
-- Hoàn thành! Kiểm tra bảng vừa tạo:
-- SELECT table_name FROM information_schema.tables
-- WHERE table_schema = 'public';
-- ============================================================
