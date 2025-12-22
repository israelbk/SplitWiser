-- Migration: User Category Orders
-- Stores per-user sort order preferences for categories (including system categories)
-- This allows each user to have their own category ordering without modifying shared system categories

-- Create user_category_orders table
CREATE TABLE IF NOT EXISTS user_category_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category_id uuid NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  sort_order numeric NOT NULL DEFAULT 0, -- Using numeric for floating point precision
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  -- Each user can only have one sort order per category
  UNIQUE(user_id, category_id)
);

-- Create indexes for efficient lookups
CREATE INDEX IF NOT EXISTS idx_user_category_orders_user_id ON user_category_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_user_category_orders_category_id ON user_category_orders(category_id);

-- Enable RLS
ALTER TABLE user_category_orders ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own category orders
CREATE POLICY "Users can read own category orders"
  ON user_category_orders
  FOR SELECT
  USING (user_id = auth.uid());

-- Policy: Users can insert their own category orders
CREATE POLICY "Users can insert own category orders"
  ON user_category_orders
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Policy: Users can update their own category orders
CREATE POLICY "Users can update own category orders"
  ON user_category_orders
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Policy: Users can delete their own category orders
CREATE POLICY "Users can delete own category orders"
  ON user_category_orders
  FOR DELETE
  USING (user_id = auth.uid());

-- Add updated_at trigger
CREATE TRIGGER set_user_category_orders_updated_at
  BEFORE UPDATE ON user_category_orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

