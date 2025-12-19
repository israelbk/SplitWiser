-- Simple RLS fix for users table
-- Drop ALL policies and create very simple ones
-- Run this in Supabase SQL Editor

-- ============================================================================
-- STEP 1: Drop ALL existing policies on users table
-- ============================================================================
DO $$ 
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN 
        SELECT policyname FROM pg_policies WHERE tablename = 'users'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON users', pol.policyname);
    END LOOP;
END $$;

-- ============================================================================
-- STEP 2: Create simple, non-recursive policies
-- ============================================================================

-- Authenticated users can read all users (simple, no recursion)
-- This is fine for a POC - in production you'd want more restrictive policies
CREATE POLICY "authenticated_read_users" ON users
  FOR SELECT TO authenticated
  USING (true);

-- Authenticated users can insert (for signup and shadow users)
CREATE POLICY "authenticated_insert_users" ON users
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- Users can update their own profile (by auth_id)
CREATE POLICY "users_update_own" ON users
  FOR UPDATE TO authenticated
  USING (auth_id = auth.uid());

-- ============================================================================
-- STEP 3: Ensure the link_shadow_user function exists and is SECURITY DEFINER
-- ============================================================================
CREATE OR REPLACE FUNCTION link_shadow_user(
  p_email TEXT,
  p_auth_id UUID,
  p_name TEXT DEFAULT NULL,
  p_avatar_url TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_user_id UUID;
  v_email_lower TEXT;
BEGIN
  v_email_lower := LOWER(p_email);
  
  -- Check if user with this email exists
  SELECT id INTO v_user_id FROM users WHERE LOWER(email) = v_email_lower;
  
  IF v_user_id IS NOT NULL THEN
    -- Link the existing user to auth
    UPDATE users 
    SET 
      auth_id = p_auth_id,
      name = COALESCE(p_name, name),
      avatar_url = COALESCE(p_avatar_url, avatar_url)
    WHERE id = v_user_id;
    
    RETURN v_user_id;
  ELSE
    -- Create new user with auth
    INSERT INTO users (email, auth_id, name, avatar_url, avatar_color)
    VALUES (
      v_email_lower, 
      p_auth_id, 
      COALESCE(p_name, split_part(v_email_lower, '@', 1)), 
      p_avatar_url,
      (ARRAY['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316', '#eab308', '#22c55e', '#14b8a6', '#06b6d4', '#3b82f6'])[floor(random() * 10 + 1)]
    )
    RETURNING id INTO v_user_id;
    
    RETURN v_user_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION link_shadow_user(TEXT, UUID, TEXT, TEXT) TO authenticated;

