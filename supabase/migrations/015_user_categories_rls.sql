-- Migration: User Categories RLS
-- Users can only see/modify their own custom categories
-- System categories are visible to all but cannot be modified by anyone

-- Drop existing policies from migration 013
DROP POLICY IF EXISTS "Anyone can view categories" ON categories;
DROP POLICY IF EXISTS "Authenticated users can create categories" ON categories;
DROP POLICY IF EXISTS "Authenticated users can update categories" ON categories;
DROP POLICY IF EXISTS "Authenticated users can delete categories" ON categories;
DROP POLICY IF EXISTS "Allow all for POC" ON categories;

-- Policy: Everyone can read system categories
CREATE POLICY "System categories are visible to all"
  ON categories
  FOR SELECT
  USING (is_system = true);

-- Policy: Users can read their own custom categories
CREATE POLICY "Users can read own custom categories"
  ON categories
  FOR SELECT
  USING (
    is_system = false 
    AND created_by = auth.uid()
  );

-- Policy: Users can create custom categories (not system)
CREATE POLICY "Users can create custom categories"
  ON categories
  FOR INSERT
  WITH CHECK (
    is_system = false 
    AND created_by = auth.uid()
  );

-- Policy: Users can update their own custom categories (cannot change is_system)
CREATE POLICY "Users can update own custom categories"
  ON categories
  FOR UPDATE
  USING (
    is_system = false 
    AND created_by = auth.uid()
  )
  WITH CHECK (
    is_system = false 
    AND created_by = auth.uid()
  );

-- Policy: Users can delete their own custom categories
CREATE POLICY "Users can delete own custom categories"
  ON categories
  FOR DELETE
  USING (
    is_system = false 
    AND created_by = auth.uid()
  );

-- Add index for efficient category lookup by user
CREATE INDEX IF NOT EXISTS idx_categories_created_by ON categories(created_by) WHERE is_system = false;

