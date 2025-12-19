-- Migration: Add Multi-Currency Support
-- Run this in your Supabase SQL Editor
-- https://supabase.com/dashboard/project/YOUR_PROJECT_ID/sql

-- ============================================
-- 1. Add currency_preferences column to users
-- ============================================
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS currency_preferences JSONB 
DEFAULT '{"displayCurrency": "ILS", "conversionMode": "off"}'::jsonb;

-- ============================================
-- 2. Create exchange_rates table
-- ============================================
CREATE TABLE IF NOT EXISTS exchange_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  base_currency TEXT NOT NULL,
  target_currency TEXT NOT NULL,
  rate DECIMAL(18,8) NOT NULL,
  rate_date DATE NOT NULL,
  fetched_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(base_currency, target_currency, rate_date)
);

-- ============================================
-- 3. Create index for efficient lookups
-- ============================================
CREATE INDEX IF NOT EXISTS idx_exchange_rates_lookup 
  ON exchange_rates(base_currency, target_currency, rate_date);

-- ============================================
-- 4. Enable Row Level Security
-- ============================================
ALTER TABLE exchange_rates ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 5. Create RLS Policy (POC: Allow all)
-- ============================================
-- Drop if exists to avoid conflict
DROP POLICY IF EXISTS "Allow all for POC" ON exchange_rates;

CREATE POLICY "Allow all for POC" 
  ON exchange_rates 
  FOR ALL 
  USING (true) 
  WITH CHECK (true);

-- ============================================
-- Verification: Check tables exist
-- ============================================
-- Run these SELECT statements to verify:
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'currency_preferences';
-- SELECT * FROM exchange_rates LIMIT 1;

