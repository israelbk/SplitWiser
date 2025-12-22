-- SplitWiser Database Schema
-- Run this in your Supabase SQL editor

-- Users (mock for POC, auth-ready)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE,
  name TEXT NOT NULL,
  avatar_url TEXT,
  avatar_color TEXT DEFAULT '#6366f1',
  currency_preferences JSONB DEFAULT '{"displayCurrency": "ILS", "conversionMode": "off"}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Categories (shared, extensible)
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  icon TEXT NOT NULL,
  color TEXT NOT NULL,
  is_system BOOLEAN DEFAULT true,
  created_by UUID REFERENCES users(id),
  sort_order INT DEFAULT 0
);

-- Groups
CREATE TABLE IF NOT EXISTS groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  type TEXT DEFAULT 'trip',
  default_currency TEXT DEFAULT 'ILS',
  cover_image_url TEXT,
  is_archived BOOLEAN DEFAULT false,
  is_deleted BOOLEAN DEFAULT false,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Group Members
CREATE TABLE IF NOT EXISTS group_members (
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member',
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (group_id, user_id)
);

-- Expenses (personal + group)
CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  description TEXT NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  currency TEXT DEFAULT 'ILS',
  category_id UUID REFERENCES categories(id),
  group_id UUID REFERENCES groups(id),
  date DATE NOT NULL,
  created_by UUID REFERENCES users(id),
  receipt_url TEXT,
  notes TEXT,
  is_recurring BOOLEAN DEFAULT false,
  recurrence_rule JSONB,
  parent_expense_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Expense Contributions - WHO PAID (supports multiple payers)
CREATE TABLE IF NOT EXISTS expense_contributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_id UUID REFERENCES expenses(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  amount DECIMAL(12,2) NOT NULL,
  UNIQUE(expense_id, user_id)
);

-- Expense Splits - WHO OWES (supports multiple split strategies)
CREATE TABLE IF NOT EXISTS expense_splits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_id UUID REFERENCES expenses(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  amount DECIMAL(12,2) NOT NULL,
  percentage DECIMAL(5,2),
  shares INT,
  split_type TEXT DEFAULT 'equal',
  is_settled BOOLEAN DEFAULT false,
  settled_at TIMESTAMPTZ,
  settled_via TEXT,
  UNIQUE(expense_id, user_id)
);

-- Settlements (future)
CREATE TABLE IF NOT EXISTS settlements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES groups(id),
  from_user UUID REFERENCES users(id),
  to_user UUID REFERENCES users(id),
  amount DECIMAL(12,2) NOT NULL,
  currency TEXT DEFAULT 'ILS',
  method TEXT,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Exchange rates cache for currency conversion
CREATE TABLE IF NOT EXISTS exchange_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  base_currency TEXT NOT NULL,
  target_currency TEXT NOT NULL,
  rate DECIMAL(18,8) NOT NULL,
  rate_date DATE NOT NULL,
  fetched_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(base_currency, target_currency, rate_date)
);

-- Indexes for performance
-- Composite index for group expenses sorted by date (covers both group lookup and sorted queries)
CREATE INDEX IF NOT EXISTS idx_expenses_group_date ON expenses(group_id, date DESC);
-- Date index for date-range filtering
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date);
-- Created_by for user's expenses lookup
CREATE INDEX IF NOT EXISTS idx_expenses_created_by ON expenses(created_by);
-- Partial index for personal expenses (faster than scanning all expenses)
CREATE INDEX IF NOT EXISTS idx_expenses_personal ON expenses(created_by) WHERE group_id IS NULL;
-- Contributions lookup by expense (for batch fetching)
CREATE INDEX IF NOT EXISTS idx_expense_contributions_expense ON expense_contributions(expense_id);
CREATE INDEX IF NOT EXISTS idx_expense_contributions_user ON expense_contributions(user_id);
-- Splits lookup by expense (for batch fetching) and by user (for user's expenses)
CREATE INDEX IF NOT EXISTS idx_expense_splits_expense ON expense_splits(expense_id);
CREATE INDEX IF NOT EXISTS idx_expense_splits_user ON expense_splits(user_id);
-- Group members by user (for fetching user's groups)
CREATE INDEX IF NOT EXISTS idx_group_members_user ON group_members(user_id);
-- Exchange rates composite lookup
CREATE INDEX IF NOT EXISTS idx_exchange_rates_lookup ON exchange_rates(base_currency, target_currency, rate_date);
-- Group status indexes (for archived/deleted filtering)
CREATE INDEX IF NOT EXISTS idx_groups_is_archived ON groups(is_archived) WHERE is_archived = true;
CREATE INDEX IF NOT EXISTS idx_groups_is_deleted ON groups(is_deleted) WHERE is_deleted = true;
CREATE INDEX IF NOT EXISTS idx_groups_active ON groups(is_archived, is_deleted) WHERE is_archived = false AND is_deleted = false;
-- Index on expenses.group_id for faster joins when filtering by group status
CREATE INDEX IF NOT EXISTS idx_expenses_group_id ON expenses(group_id) WHERE group_id IS NOT NULL;

-- Enable Row Level Security (for future auth)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_splits ENABLE ROW LEVEL SECURITY;
ALTER TABLE settlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE exchange_rates ENABLE ROW LEVEL SECURITY;

-- For POC: Allow all operations (no auth)
CREATE POLICY "Allow all for POC" ON users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for POC" ON categories FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for POC" ON groups FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for POC" ON group_members FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for POC" ON expenses FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for POC" ON expense_contributions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for POC" ON expense_splits FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for POC" ON settlements FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for POC" ON exchange_rates FOR ALL USING (true) WITH CHECK (true);

