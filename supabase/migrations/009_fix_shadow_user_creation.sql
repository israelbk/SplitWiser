-- Fix shadow user creation for DEV MODE
-- In DEV MODE, there's no actual Supabase Auth session, so auth.uid() returns NULL
-- This causes RLS policies to block shadow user creation
-- Solution: Create a SECURITY DEFINER function that bypasses RLS

-- ============================================================================
-- Create SECURITY DEFINER function for shadow user creation
-- This function bypasses RLS and handles all the logic internally
-- ============================================================================
CREATE OR REPLACE FUNCTION create_shadow_user(
  p_email TEXT,
  p_name TEXT DEFAULT NULL,
  p_invited_by UUID DEFAULT NULL,
  p_avatar_color TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_user_id UUID;
  v_email_lower TEXT;
  v_name TEXT;
  v_color TEXT;
BEGIN
  v_email_lower := LOWER(TRIM(p_email));
  
  -- Validate email format
  IF v_email_lower !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' THEN
    RAISE EXCEPTION 'Invalid email format: %', p_email;
  END IF;
  
  -- Check if user with this email already exists
  SELECT id INTO v_user_id FROM users WHERE LOWER(email) = v_email_lower;
  
  IF v_user_id IS NOT NULL THEN
    -- User already exists, just return their ID
    RETURN v_user_id;
  END IF;
  
  -- Generate name from email if not provided
  v_name := COALESCE(p_name, split_part(v_email_lower, '@', 1));
  
  -- Generate random color if not provided
  v_color := COALESCE(p_avatar_color, 
    (ARRAY['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316', '#eab308', '#22c55e', '#14b8a6', '#06b6d4', '#3b82f6'])[floor(random() * 10 + 1)]
  );
  
  -- Create the shadow user
  INSERT INTO users (email, name, avatar_color, invited_by)
  VALUES (v_email_lower, v_name, v_color, p_invited_by)
  RETURNING id INTO v_user_id;
  
  RETURN v_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute to authenticated users and anon (for dev mode)
GRANT EXECUTE ON FUNCTION create_shadow_user(TEXT, TEXT, UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION create_shadow_user(TEXT, TEXT, UUID, TEXT) TO anon;

-- ============================================================================
-- Also update the "Allow all for POC" policy on users table 
-- to ensure DEV MODE works without full auth
-- ============================================================================
-- First drop any restrictive policies that might exist
DROP POLICY IF EXISTS "users_insert_shadow" ON users;

-- Re-create a more permissive insert policy that allows shadow user creation
-- This checks that either:
-- 1. The user is creating their own profile (auth signup)
-- 2. The user is creating a shadow user via the authenticated session
-- 3. It's DEV MODE (anon user can insert with proper constraints)
CREATE POLICY "users_insert_shadow" ON users
  FOR INSERT WITH CHECK (
    -- Creating own profile during signup
    auth_id = auth.uid()
    OR
    -- Creating shadow user while authenticated
    (auth_id IS NULL AND invited_by = get_user_id_from_auth())
    OR
    -- DEV MODE: Allow creating shadow users if invited_by is set to a valid user
    (auth_id IS NULL AND invited_by IS NOT NULL AND EXISTS (SELECT 1 FROM users WHERE id = invited_by))
  );

