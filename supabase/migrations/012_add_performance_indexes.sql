-- Performance optimization indexes
-- These indexes improve query performance for common access patterns

-- Index on group_members.user_id for faster group lookups by user
-- Used when fetching all groups a user belongs to
CREATE INDEX IF NOT EXISTS idx_group_members_user ON group_members(user_id);

-- Composite index for personal expense queries (created_by with null group_id)
-- Improves performance of findPersonalExpenses
CREATE INDEX IF NOT EXISTS idx_expenses_personal ON expenses(created_by) WHERE group_id IS NULL;

-- Composite index for group expenses sorted by date (very common query pattern)
-- Eliminates the need to sort after fetching: SELECT * FROM expenses WHERE group_id = ? ORDER BY date DESC
CREATE INDEX IF NOT EXISTS idx_expenses_group_date ON expenses(group_id, date DESC);

-- Drop the old single-column index since the composite one covers it
-- (PostgreSQL can use the composite index for group_id-only queries too)
DROP INDEX IF EXISTS idx_expenses_group;

