-- Fix RLS policies for group creation
-- SIMPLE APPROACH: Just pass emails - the function creates/finds users as needed

-- ============================================================================
-- STEP 1: Drop ALL existing group and group_members policies
-- ============================================================================
DROP POLICY IF EXISTS "Users can view own groups" ON groups;
DROP POLICY IF EXISTS "Users can create groups" ON groups;
DROP POLICY IF EXISTS "Group creators can update groups" ON groups;
DROP POLICY IF EXISTS "Group creators can delete groups" ON groups;
DROP POLICY IF EXISTS "Users can view group members of their groups" ON group_members;
DROP POLICY IF EXISTS "Group creators can manage members" ON group_members;
DROP POLICY IF EXISTS "Group creators can remove members" ON group_members;
DROP POLICY IF EXISTS "groups_select_own" ON groups;
DROP POLICY IF EXISTS "groups_select_admin" ON groups;
DROP POLICY IF EXISTS "groups_select" ON groups;
DROP POLICY IF EXISTS "groups_insert" ON groups;
DROP POLICY IF EXISTS "groups_update" ON groups;
DROP POLICY IF EXISTS "groups_delete" ON groups;
DROP POLICY IF EXISTS "group_members_select" ON group_members;
DROP POLICY IF EXISTS "group_members_select_admin" ON group_members;
DROP POLICY IF EXISTS "group_members_insert" ON group_members;
DROP POLICY IF EXISTS "group_members_delete" ON group_members;

-- ============================================================================
-- STEP 2: Drop old functions
-- ============================================================================
DROP FUNCTION IF EXISTS create_group_with_members(TEXT, UUID, UUID[], TEXT, TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS create_group_with_members(TEXT, TEXT, TEXT, TEXT, TEXT, UUID, UUID[]);
DROP FUNCTION IF EXISTS create_group_with_emails(TEXT, TEXT, TEXT[], TEXT, TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS add_group_member(UUID, UUID, TEXT);
DROP FUNCTION IF EXISTS add_group_member_by_email(UUID, TEXT, TEXT);

-- ============================================================================
-- STEP 3: Helper function to get or create user by email
-- ============================================================================
CREATE OR REPLACE FUNCTION public.get_or_create_user_by_email(p_email TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_email_lower TEXT;
  v_name TEXT;
  v_color TEXT;
BEGIN
  v_email_lower := LOWER(TRIM(p_email));
  
  -- Check if user exists
  SELECT id INTO v_user_id FROM users WHERE LOWER(email) = v_email_lower;
  
  IF v_user_id IS NOT NULL THEN
    RETURN v_user_id;
  END IF;
  
  -- Create new user (shadow user - no auth_id)
  v_name := split_part(v_email_lower, '@', 1);
  v_color := (ARRAY['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316', '#eab308', '#22c55e', '#14b8a6', '#06b6d4', '#3b82f6'])[floor(random() * 10 + 1)];
  
  INSERT INTO users (email, name, avatar_color)
  VALUES (v_email_lower, v_name, v_color)
  RETURNING id INTO v_user_id;
  
  RETURN v_user_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_or_create_user_by_email(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_or_create_user_by_email(TEXT) TO anon;

-- ============================================================================
-- STEP 4: Main function - create group with emails (no UUIDs needed!)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.create_group_with_emails(
  p_name TEXT,
  p_creator_email TEXT,
  p_member_emails TEXT[] DEFAULT '{}',
  p_description TEXT DEFAULT NULL,
  p_type TEXT DEFAULT 'trip',
  p_default_currency TEXT DEFAULT 'ILS',
  p_cover_image_url TEXT DEFAULT NULL
)
RETURNS UUID 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_group_id UUID;
  v_creator_id UUID;
  v_member_id UUID;
  v_member_email TEXT;
BEGIN
  -- Get or create the creator user
  v_creator_id := get_or_create_user_by_email(p_creator_email);
  
  -- Create the group
  INSERT INTO groups (name, description, type, default_currency, cover_image_url, created_by)
  VALUES (p_name, p_description, p_type, p_default_currency, p_cover_image_url, v_creator_id)
  RETURNING id INTO v_group_id;

  -- Add creator as owner
  INSERT INTO group_members (group_id, user_id, role)
  VALUES (v_group_id, v_creator_id, 'owner');

  -- Add other members by email
  IF p_member_emails IS NOT NULL THEN
    FOREACH v_member_email IN ARRAY p_member_emails
    LOOP
      IF v_member_email IS NOT NULL AND LOWER(TRIM(v_member_email)) != LOWER(TRIM(p_creator_email)) THEN
        v_member_id := get_or_create_user_by_email(v_member_email);
        INSERT INTO group_members (group_id, user_id, role)
        VALUES (v_group_id, v_member_id, 'member')
        ON CONFLICT (group_id, user_id) DO NOTHING;
      END IF;
    END LOOP;
  END IF;

  RETURN v_group_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_group_with_emails(TEXT, TEXT, TEXT[], TEXT, TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_group_with_emails(TEXT, TEXT, TEXT[], TEXT, TEXT, TEXT, TEXT) TO anon;

-- ============================================================================
-- STEP 5: Add member by email function
-- ============================================================================
CREATE OR REPLACE FUNCTION public.add_group_member_by_email(
  p_group_id UUID,
  p_email TEXT,
  p_role TEXT DEFAULT 'member'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  v_user_id := get_or_create_user_by_email(p_email);
  
  INSERT INTO group_members (group_id, user_id, role)
  VALUES (p_group_id, v_user_id, p_role)
  ON CONFLICT (group_id, user_id) DO UPDATE SET role = p_role;
  
  RETURN v_user_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.add_group_member_by_email(UUID, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.add_group_member_by_email(UUID, TEXT, TEXT) TO anon;

-- ============================================================================
-- STEP 6: Simple RLS policies - permissive for authenticated users
-- ============================================================================

-- GROUPS: View groups you're a member of
CREATE POLICY "groups_select" ON groups FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM group_members gm
    JOIN users u ON u.id = gm.user_id
    WHERE gm.group_id = groups.id AND u.auth_id = auth.uid()
  )
  OR EXISTS (SELECT 1 FROM users WHERE auth_id = auth.uid() AND role = 'admin')
);

-- GROUPS: Any authenticated user can insert (function handles it)
CREATE POLICY "groups_insert" ON groups FOR INSERT WITH CHECK (true);

-- GROUPS: Creator or admin can update
CREATE POLICY "groups_update" ON groups FOR UPDATE USING (
  EXISTS (SELECT 1 FROM users WHERE id = groups.created_by AND auth_id = auth.uid())
  OR EXISTS (SELECT 1 FROM users WHERE auth_id = auth.uid() AND role = 'admin')
);

-- GROUPS: Creator or admin can delete
CREATE POLICY "groups_delete" ON groups FOR DELETE USING (
  EXISTS (SELECT 1 FROM users WHERE id = groups.created_by AND auth_id = auth.uid())
  OR EXISTS (SELECT 1 FROM users WHERE auth_id = auth.uid() AND role = 'admin')
);

-- GROUP_MEMBERS: View members in your groups
CREATE POLICY "group_members_select" ON group_members FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM group_members gm
    JOIN users u ON u.id = gm.user_id  
    WHERE gm.group_id = group_members.group_id AND u.auth_id = auth.uid()
  )
  OR EXISTS (SELECT 1 FROM users WHERE auth_id = auth.uid() AND role = 'admin')
);

-- GROUP_MEMBERS: Any authenticated user can insert (function handles it)
CREATE POLICY "group_members_insert" ON group_members FOR INSERT WITH CHECK (true);

-- GROUP_MEMBERS: Creator or self can delete
CREATE POLICY "group_members_delete" ON group_members FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM groups g
    JOIN users u ON u.id = g.created_by
    WHERE g.id = group_members.group_id AND u.auth_id = auth.uid()
  )
  OR EXISTS (SELECT 1 FROM users WHERE id = group_members.user_id AND auth_id = auth.uid())
  OR EXISTS (SELECT 1 FROM users WHERE auth_id = auth.uid() AND role = 'admin')
);

-- ============================================================================
-- Done! Now just pass emails - no need to worry about user IDs or existence
-- ============================================================================

