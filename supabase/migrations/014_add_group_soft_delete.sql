-- Add soft delete support for groups
-- This allows deleting groups without losing expense data

-- Add is_deleted column to groups table
ALTER TABLE groups ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false;

-- Create indexes for better query performance on filtered queries
-- Index for is_archived (frequently used in group list queries)
CREATE INDEX IF NOT EXISTS idx_groups_is_archived ON groups(is_archived) WHERE is_archived = true;

-- Index for is_deleted (used to filter out deleted groups)
CREATE INDEX IF NOT EXISTS idx_groups_is_deleted ON groups(is_deleted) WHERE is_deleted = true;

-- Composite index for common query pattern: active groups (not archived, not deleted)
CREATE INDEX IF NOT EXISTS idx_groups_active ON groups(is_archived, is_deleted) WHERE is_archived = false AND is_deleted = false;

-- Index on expenses.group_id for faster joins when filtering by group status
-- (This may already exist, but we ensure it's there)
CREATE INDEX IF NOT EXISTS idx_expenses_group_id ON expenses(group_id) WHERE group_id IS NOT NULL;

