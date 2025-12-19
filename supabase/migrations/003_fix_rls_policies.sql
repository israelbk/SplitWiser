-- Fix RLS policies - remove recursive is_admin() calls
-- Run this in Supabase SQL Editor

-- Drop the problematic is_admin function
DROP FUNCTION IF EXISTS is_admin();

-- Drop all existing policies on users table
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can insert own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;

-- Create simple, non-recursive policies for users table
-- Users can always read their own profile
CREATE POLICY "Users can read own profile" ON users
  FOR SELECT USING (id = auth.uid());

-- Admins can read all profiles (check role directly, no function call)
CREATE POLICY "Admins can read all profiles" ON users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() AND u.role = 'admin'
    )
  );

-- Users can insert their own profile
CREATE POLICY "Users can insert own profile" ON users
  FOR INSERT WITH CHECK (id = auth.uid());

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (id = auth.uid());

-- For other tables, simplify the admin check too
-- Drop and recreate expense policies
DROP POLICY IF EXISTS "Users can view own expenses" ON expenses;
CREATE POLICY "Users can view own expenses" ON expenses
  FOR SELECT USING (
    created_by = auth.uid()
    OR (group_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM group_members 
      WHERE group_id = expenses.group_id AND user_id = auth.uid()
    ))
  );

CREATE POLICY "Admins can view all expenses" ON expenses
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

