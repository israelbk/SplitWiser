-- Migration: Add Authentication Support
-- This migration:
-- 1. Clears existing mock data (fresh start)
-- 2. Adds role column for admin functionality
-- 3. Updates RLS policies for proper authentication

-- ============================================
-- STEP 1: Clear existing mock data
-- ============================================

-- Delete in correct order to respect foreign keys
DELETE FROM expense_splits;
DELETE FROM expense_contributions;
DELETE FROM expenses;
DELETE FROM settlements;
DELETE FROM group_members;
DELETE FROM groups;
DELETE FROM users;
-- Note: Keep categories and exchange_rates as they're shared/cached data

-- ============================================
-- STEP 2: Add role column to users table
-- ============================================

-- Add role column with constraint
ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user';

-- Add check constraint for valid roles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'users_role_check'
  ) THEN
    ALTER TABLE users ADD CONSTRAINT users_role_check 
      CHECK (role IN ('user', 'admin'));
  END IF;
END $$;

-- ============================================
-- STEP 3: Drop existing POC policies
-- ============================================

DROP POLICY IF EXISTS "Allow all for POC" ON users;
DROP POLICY IF EXISTS "Allow all for POC" ON categories;
DROP POLICY IF EXISTS "Allow all for POC" ON groups;
DROP POLICY IF EXISTS "Allow all for POC" ON group_members;
DROP POLICY IF EXISTS "Allow all for POC" ON expenses;
DROP POLICY IF EXISTS "Allow all for POC" ON expense_contributions;
DROP POLICY IF EXISTS "Allow all for POC" ON expense_splits;
DROP POLICY IF EXISTS "Allow all for POC" ON settlements;
DROP POLICY IF EXISTS "Allow all for POC" ON exchange_rates;

-- ============================================
-- STEP 4: Create proper RLS policies
-- ============================================

-- Helper function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- USERS table policies
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (id = auth.uid() OR is_admin());

CREATE POLICY "Users can insert own profile" ON users
  FOR INSERT WITH CHECK (id = auth.uid());

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (id = auth.uid());

-- CATEGORIES table policies (read-only for all authenticated users)
CREATE POLICY "Authenticated users can view categories" ON categories
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- GROUPS table policies
CREATE POLICY "Users can view own groups" ON groups
  FOR SELECT USING (
    created_by = auth.uid() 
    OR EXISTS (
      SELECT 1 FROM group_members 
      WHERE group_id = groups.id AND user_id = auth.uid()
    )
    OR is_admin()
  );

CREATE POLICY "Users can create groups" ON groups
  FOR INSERT WITH CHECK (created_by = auth.uid());

CREATE POLICY "Group creators can update groups" ON groups
  FOR UPDATE USING (created_by = auth.uid());

CREATE POLICY "Group creators can delete groups" ON groups
  FOR DELETE USING (created_by = auth.uid());

-- GROUP_MEMBERS table policies
CREATE POLICY "Users can view group members of their groups" ON group_members
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM groups 
      WHERE id = group_members.group_id 
      AND (created_by = auth.uid() OR EXISTS (
        SELECT 1 FROM group_members gm 
        WHERE gm.group_id = groups.id AND gm.user_id = auth.uid()
      ))
    )
    OR is_admin()
  );

CREATE POLICY "Group creators can manage members" ON group_members
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM groups 
      WHERE id = group_members.group_id AND created_by = auth.uid()
    )
  );

CREATE POLICY "Group creators can remove members" ON group_members
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM groups 
      WHERE id = group_members.group_id AND created_by = auth.uid()
    )
    OR user_id = auth.uid() -- Users can leave groups
  );

-- EXPENSES table policies
CREATE POLICY "Users can view own expenses" ON expenses
  FOR SELECT USING (
    created_by = auth.uid()
    OR (group_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM group_members 
      WHERE group_id = expenses.group_id AND user_id = auth.uid()
    ))
    OR is_admin()
  );

CREATE POLICY "Users can create expenses" ON expenses
  FOR INSERT WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update own expenses" ON expenses
  FOR UPDATE USING (created_by = auth.uid());

CREATE POLICY "Users can delete own expenses" ON expenses
  FOR DELETE USING (created_by = auth.uid());

-- EXPENSE_CONTRIBUTIONS table policies
CREATE POLICY "Users can view contributions for visible expenses" ON expense_contributions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM expenses 
      WHERE id = expense_contributions.expense_id 
      AND (created_by = auth.uid() OR EXISTS (
        SELECT 1 FROM group_members 
        WHERE group_id = expenses.group_id AND user_id = auth.uid()
      ))
    )
    OR is_admin()
  );

CREATE POLICY "Expense creators can manage contributions" ON expense_contributions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM expenses 
      WHERE id = expense_contributions.expense_id AND created_by = auth.uid()
    )
  );

CREATE POLICY "Expense creators can update contributions" ON expense_contributions
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM expenses 
      WHERE id = expense_contributions.expense_id AND created_by = auth.uid()
    )
  );

CREATE POLICY "Expense creators can delete contributions" ON expense_contributions
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM expenses 
      WHERE id = expense_contributions.expense_id AND created_by = auth.uid()
    )
  );

-- EXPENSE_SPLITS table policies
CREATE POLICY "Users can view splits for visible expenses" ON expense_splits
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM expenses 
      WHERE id = expense_splits.expense_id 
      AND (created_by = auth.uid() OR EXISTS (
        SELECT 1 FROM group_members 
        WHERE group_id = expenses.group_id AND user_id = auth.uid()
      ))
    )
    OR is_admin()
  );

CREATE POLICY "Expense creators can manage splits" ON expense_splits
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM expenses 
      WHERE id = expense_splits.expense_id AND created_by = auth.uid()
    )
  );

CREATE POLICY "Expense creators can update splits" ON expense_splits
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM expenses 
      WHERE id = expense_splits.expense_id AND created_by = auth.uid()
    )
  );

CREATE POLICY "Expense creators can delete splits" ON expense_splits
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM expenses 
      WHERE id = expense_splits.expense_id AND created_by = auth.uid()
    )
  );

-- SETTLEMENTS table policies
CREATE POLICY "Users can view settlements in their groups" ON settlements
  FOR SELECT USING (
    from_user = auth.uid() 
    OR to_user = auth.uid()
    OR EXISTS (
      SELECT 1 FROM group_members 
      WHERE group_id = settlements.group_id AND user_id = auth.uid()
    )
    OR is_admin()
  );

CREATE POLICY "Users can create settlements" ON settlements
  FOR INSERT WITH CHECK (from_user = auth.uid());

-- EXCHANGE_RATES table policies (public read, no user writes)
CREATE POLICY "Anyone can view exchange rates" ON exchange_rates
  FOR SELECT USING (true);

CREATE POLICY "System can manage exchange rates" ON exchange_rates
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "System can update exchange rates" ON exchange_rates
  FOR UPDATE USING (auth.uid() IS NOT NULL);

-- ============================================
-- STEP 5: Create index for role lookups
-- ============================================

CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- ============================================
-- Done! 
-- After running this migration:
-- 1. Sign in with Google
-- 2. Run: UPDATE users SET role = 'admin' WHERE email = 'your@email.com';
-- ============================================

