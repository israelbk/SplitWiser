-- Shadow Users Support
-- Allows adding users by email who haven't signed up yet
-- When they sign up, their account is automatically linked

-- Add auth_id column (nullable - shadow users don't have one)
ALTER TABLE users ADD COLUMN IF NOT EXISTS auth_id UUID UNIQUE;

-- Add invited_by column (who created this shadow user)
ALTER TABLE users ADD COLUMN IF NOT EXISTS invited_by UUID REFERENCES users(id);

-- Make email required and unique (needed for shadow user matching)
-- First, update any null emails to placeholder values
UPDATE users SET email = id::text || '@placeholder.local' WHERE email IS NULL;

-- Now make email NOT NULL and add unique constraint
ALTER TABLE users ALTER COLUMN email SET NOT NULL;

-- Add unique constraint on email if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'users_email_unique'
  ) THEN
    ALTER TABLE users ADD CONSTRAINT users_email_unique UNIQUE (email);
  END IF;
END $$;

-- Create index for faster email lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_auth_id ON users(auth_id);

-- View to easily identify shadow users
CREATE OR REPLACE VIEW shadow_users AS
SELECT * FROM users WHERE auth_id IS NULL AND invited_by IS NOT NULL;

-- Function to link a shadow user when they sign up
CREATE OR REPLACE FUNCTION link_shadow_user(
  p_email TEXT,
  p_auth_id UUID,
  p_name TEXT DEFAULT NULL,
  p_avatar_url TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Check if user with this email exists
  SELECT id INTO v_user_id FROM users WHERE email = p_email;
  
  IF v_user_id IS NOT NULL THEN
    -- Link the existing shadow user to auth
    UPDATE users 
    SET 
      auth_id = p_auth_id,
      name = COALESCE(p_name, name),
      avatar_url = COALESCE(p_avatar_url, avatar_url)
    WHERE id = v_user_id;
    
    RETURN v_user_id;
  ELSE
    -- Create new user with auth
    INSERT INTO users (email, auth_id, name, avatar_url)
    VALUES (p_email, p_auth_id, COALESCE(p_name, split_part(p_email, '@', 1)), p_avatar_url)
    RETURNING id INTO v_user_id;
    
    RETURN v_user_id;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to get contactable users (people you've been in groups with)
CREATE OR REPLACE FUNCTION get_contactable_users(p_user_id UUID)
RETURNS SETOF users AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT u.*
  FROM users u
  INNER JOIN group_members gm ON gm.user_id = u.id
  WHERE gm.group_id IN (
    -- Groups the current user is a member of
    SELECT group_id FROM group_members WHERE user_id = p_user_id
  )
  AND u.id != p_user_id
  ORDER BY u.name;
END;
$$ LANGUAGE plpgsql;

-- RLS Policies for shadow user management

-- Allow users to create shadow users (invited_by must be set to current user)
DROP POLICY IF EXISTS "Users can create shadow users" ON users;
CREATE POLICY "Users can create shadow users" ON users
  FOR INSERT WITH CHECK (
    -- Either creating themselves (auth signup) or creating a shadow user
    auth_id = auth.uid() 
    OR (auth_id IS NULL AND invited_by = auth.uid())
  );

-- Allow users to see:
-- 1. Their own profile
-- 2. Members of groups they're in
-- 3. Shadow users they created
DROP POLICY IF EXISTS "Users can view relevant users" ON users;
CREATE POLICY "Users can view relevant users" ON users
  FOR SELECT USING (
    -- Own profile
    auth_id = auth.uid()
    OR
    -- Co-members of groups
    id IN (
      SELECT gm.user_id FROM group_members gm
      WHERE gm.group_id IN (
        SELECT group_id FROM group_members WHERE user_id = (
          SELECT id FROM users WHERE auth_id = auth.uid()
        )
      )
    )
    OR
    -- Shadow users I created
    invited_by = (SELECT id FROM users WHERE auth_id = auth.uid())
  );

-- Comment explaining the shadow user flow
COMMENT ON COLUMN users.auth_id IS 'Supabase auth user ID. NULL for shadow users who havent signed up yet.';
COMMENT ON COLUMN users.invited_by IS 'User ID of who invited this shadow user. NULL for regular users.';

