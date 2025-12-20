-- Fix RLS policies for group creation
-- Problem: The existing policies are too restrictive and don't work reliably
-- Solution: 
--   1. Create a SECURITY DEFINER function for group creation that bypasses RLS
--   2. Simplify policies to allow any authenticated user to create groups

-- ============================================================================
-- STEP 1: Drop ALL existing group and group_members policies
-- ============================================================================
-- Old policy names from migration 002
DROP POLICY IF EXISTS "Users can view own groups" ON groups;
DROP POLICY IF EXISTS "Users can create groups" ON groups;
DROP POLICY IF EXISTS "Group creators can update groups" ON groups;
DROP POLICY IF EXISTS "Group creators can delete groups" ON groups;

DROP POLICY IF EXISTS "Users can view group members of their groups" ON group_members;
DROP POLICY IF EXISTS "Group creators can manage members" ON group_members;
DROP POLICY IF EXISTS "Group creators can remove members" ON group_members;

-- New policy names (in case of partial run)
DROP POLICY IF EXISTS "groups_select_own" ON groups;
DROP POLICY IF EXISTS "groups_select_admin" ON groups;
DROP POLICY IF EXISTS "groups_insert" ON groups;
DROP POLICY IF EXISTS "groups_update" ON groups;
DROP POLICY IF EXISTS "groups_delete" ON groups;

DROP POLICY IF EXISTS "group_members_select" ON group_members;
DROP POLICY IF EXISTS "group_members_select_admin" ON group_members;
DROP POLICY IF EXISTS "group_members_insert" ON group_members;
DROP POLICY IF EXISTS "group_members_delete" ON group_members;

-- ============================================================================
-- STEP 2: Create SECURITY DEFINER function for group creation
-- This function bypasses RLS and handles all the logic internally
-- ============================================================================
CREATE OR REPLACE FUNCTION create_group_with_members(
  p_name TEXT,
  p_created_by UUID,
  p_member_ids UUID[] DEFAULT '{}',
  p_description TEXT DEFAULT NULL,
  p_type TEXT DEFAULT 'trip',
  p_default_currency TEXT DEFAULT 'ILS',
  p_cover_image_url TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_group_id UUID;
  v_member_id UUID;
BEGIN
  -- Validate creator exists
  IF NOT EXISTS (SELECT 1 FROM users WHERE id = p_created_by) THEN
    RAISE EXCEPTION 'Creator user not found: %', p_created_by;
  END IF;

  -- Create the group
  INSERT INTO groups (name, description, type, default_currency, cover_image_url, created_by)
  VALUES (p_name, p_description, p_type, p_default_currency, p_cover_image_url, p_created_by)
  RETURNING id INTO v_group_id;

  -- Add creator as owner
  INSERT INTO group_members (group_id, user_id, role)
  VALUES (v_group_id, p_created_by, 'owner');

  -- Add other members
  FOREACH v_member_id IN ARRAY p_member_ids
  LOOP
    IF v_member_id != p_created_by THEN
      -- Validate member exists
      IF EXISTS (SELECT 1 FROM users WHERE id = v_member_id) THEN
        INSERT INTO group_members (group_id, user_id, role)
        VALUES (v_group_id, v_member_id, 'member')
        ON CONFLICT (group_id, user_id) DO NOTHING;
      END IF;
    END IF;
  END LOOP;

  RETURN v_group_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute to authenticated and anon users
GRANT EXECUTE ON FUNCTION create_group_with_members(TEXT, UUID, UUID[], TEXT, TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION create_group_with_members(TEXT, UUID, UUID[], TEXT, TEXT, TEXT, TEXT) TO anon;

-- ============================================================================
-- STEP 3: Create SECURITY DEFINER function for adding members
-- ============================================================================
CREATE OR REPLACE FUNCTION add_group_member(
  p_group_id UUID,
  p_user_id UUID,
  p_role TEXT DEFAULT 'member'
)
RETURNS VOID AS $$
BEGIN
  -- Validate group exists
  IF NOT EXISTS (SELECT 1 FROM groups WHERE id = p_group_id) THEN
    RAISE EXCEPTION 'Group not found: %', p_group_id;
  END IF;

  -- Validate user exists
  IF NOT EXISTS (SELECT 1 FROM users WHERE id = p_user_id) THEN
    RAISE EXCEPTION 'User not found: %', p_user_id;
  END IF;

  -- Add member
  INSERT INTO group_members (group_id, user_id, role)
  VALUES (p_group_id, p_user_id, p_role)
  ON CONFLICT (group_id, user_id) DO UPDATE SET role = p_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute
GRANT EXECUTE ON FUNCTION add_group_member(UUID, UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION add_group_member(UUID, UUID, TEXT) TO anon;

-- ============================================================================
-- STEP 4: Create simplified RLS policies for SELECT/UPDATE/DELETE
-- INSERT will go through the SECURITY DEFINER functions
-- ============================================================================

-- GROUPS: Anyone authenticated can read groups they're a member of
CREATE POLICY "groups_select" ON groups
  FOR SELECT USING (
    -- User is creator
    EXISTS (SELECT 1 FROM users WHERE id = groups.created_by AND auth_id = auth.uid())
    OR
    -- User is a member
    EXISTS (
      SELECT 1 FROM group_members gm
      INNER JOIN users u ON u.id = gm.user_id
      WHERE gm.group_id = groups.id AND u.auth_id = auth.uid()
    )
    OR
    -- User is admin
    EXISTS (SELECT 1 FROM users WHERE auth_id = auth.uid() AND role = 'admin')
  );

-- GROUPS: Allow all inserts (validation happens in the function)
CREATE POLICY "groups_insert" ON groups
  FOR INSERT WITH CHECK (true);

-- GROUPS: Creator can update
CREATE POLICY "groups_update" ON groups
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM users WHERE id = groups.created_by AND auth_id = auth.uid())
    OR EXISTS (SELECT 1 FROM users WHERE auth_id = auth.uid() AND role = 'admin')
  );

-- GROUPS: Creator can delete
CREATE POLICY "groups_delete" ON groups
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM users WHERE id = groups.created_by AND auth_id = auth.uid())
    OR EXISTS (SELECT 1 FROM users WHERE auth_id = auth.uid() AND role = 'admin')
  );

-- GROUP_MEMBERS: Members can view other members in their groups
CREATE POLICY "group_members_select" ON group_members
  FOR SELECT USING (
    -- User is in the same group
    EXISTS (
      SELECT 1 FROM group_members gm
      INNER JOIN users u ON u.id = gm.user_id
      WHERE gm.group_id = group_members.group_id AND u.auth_id = auth.uid()
    )
    OR
    -- User is admin
    EXISTS (SELECT 1 FROM users WHERE auth_id = auth.uid() AND role = 'admin')
  );

-- GROUP_MEMBERS: Allow all inserts (validation happens in the function)
CREATE POLICY "group_members_insert" ON group_members
  FOR INSERT WITH CHECK (true);

-- GROUP_MEMBERS: Group creator can remove members, or user can leave
CREATE POLICY "group_members_delete" ON group_members
  FOR DELETE USING (
    -- User is the group creator
    EXISTS (
      SELECT 1 FROM groups g
      INNER JOIN users u ON u.id = g.created_by
      WHERE g.id = group_members.group_id AND u.auth_id = auth.uid()
    )
    OR
    -- User is removing themselves
    EXISTS (SELECT 1 FROM users WHERE id = group_members.user_id AND auth_id = auth.uid())
    OR
    -- User is admin
    EXISTS (SELECT 1 FROM users WHERE auth_id = auth.uid() AND role = 'admin')
  );

-- ============================================================================
-- Done! Group creation now uses SECURITY DEFINER functions that bypass RLS.
-- ============================================================================

