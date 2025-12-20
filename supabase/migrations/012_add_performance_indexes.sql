-- Performance optimization indexes
-- These indexes improve query performance for common access patterns

-- Index on group_members.user_id for faster group lookups by user
-- Used when fetching all groups a user belongs to
CREATE INDEX IF NOT EXISTS idx_group_members_user ON group_members(user_id);

-- Composite index for personal expense queries (created_by with null group_id)
-- Improves performance of findPersonalExpenses
CREATE INDEX IF NOT EXISTS idx_expenses_personal ON expenses(created_by) WHERE group_id IS NULL;

