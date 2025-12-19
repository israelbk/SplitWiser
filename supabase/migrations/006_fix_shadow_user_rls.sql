-- Fix RLS policies for shadow users
-- The previous migration created recursive policies that blocked login
-- Run this in Supabase SQL Editor

-- ============================================================================
-- STEP 1: Drop problematic policies
-- ============================================================================
DROP POLICY IF EXISTS "Users can create shadow users" ON users;
DROP POLICY IF EXISTS "Users can view relevant users" ON users;
DROP POLICY IF EXISTS "Users can read own profile" ON users;
DROP POLICY IF EXISTS "Admins can read all profiles" ON users;
DROP POLICY IF EXISTS "Users can insert own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Allow all for POC" ON users;

-- ============================================================================
-- STEP 2: Create a SECURITY DEFINER function to get user ID from auth
-- This bypasses RLS to avoid recursive dependency
-- ============================================================================
CREATE OR REPLACE FUNCTION get_user_id_from_auth()
RETURNS UUID AS $$
  SELECT id FROM users WHERE auth_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION get_user_id_from_auth() TO authenticated;

-- ============================================================================
-- STEP 3: Create simple, working RLS policies
-- ============================================================================

-- Users can SELECT their own profile by auth_id
CREATE POLICY "users_select_own_by_auth" ON users
  FOR SELECT USING (auth_id = auth.uid());

-- Users can SELECT co-members of their groups
CREATE POLICY "users_select_group_members" ON users
  FOR SELECT USING (
    id IN (
      SELECT gm2.user_id 
      FROM group_members gm1
      INNER JOIN group_members gm2 ON gm1.group_id = gm2.group_id
      WHERE gm1.user_id = get_user_id_from_auth()
    )
  );

-- Users can SELECT shadow users they created
CREATE POLICY "users_select_own_shadow_users" ON users
  FOR SELECT USING (invited_by = get_user_id_from_auth());

-- Users can INSERT their own profile (during signup)
CREATE POLICY "users_insert_own" ON users
  FOR INSERT WITH CHECK (auth_id = auth.uid());

-- Users can INSERT shadow users (invited_by must be themselves)
CREATE POLICY "users_insert_shadow" ON users
  FOR INSERT WITH CHECK (
    auth_id IS NULL 
    AND invited_by = get_user_id_from_auth()
  );

-- Users can UPDATE their own profile
CREATE POLICY "users_update_own" ON users
  FOR UPDATE USING (auth_id = auth.uid());

-- Admins can do everything
CREATE POLICY "users_admin_all" ON users
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.auth_id = auth.uid() AND u.role = 'admin'
    )
  );

-- ============================================================================
-- STEP 4: Update the link_shadow_user function to be SECURITY DEFINER
-- This allows it to bypass RLS when creating/updating users
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
    -- Link the existing user to auth (could be shadow user or existing)
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
      -- Random color
      (ARRAY['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316', '#eab308', '#22c55e', '#14b8a6', '#06b6d4', '#3b82f6'])[floor(random() * 10 + 1)]
    )
    RETURNING id INTO v_user_id;
    
    RETURN v_user_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION link_shadow_user(TEXT, UUID, TEXT, TEXT) TO authenticated;

