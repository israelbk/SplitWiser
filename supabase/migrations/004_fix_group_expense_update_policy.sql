-- Fix RLS policy to allow group members to update group expenses
-- Run this in Supabase SQL Editor

-- Drop the restrictive update policy
DROP POLICY IF EXISTS "Users can update own expenses" ON expenses;

-- Create new policy that allows:
-- 1. Users to update their own personal expenses
-- 2. Group members to update any expense in their group
CREATE POLICY "Users can update own or group expenses" ON expenses
  FOR UPDATE USING (
    -- Can update own personal expense
    (created_by = auth.uid() AND group_id IS NULL)
    OR 
    -- Can update any expense in a group they belong to
    (group_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM group_members 
      WHERE group_id = expenses.group_id AND user_id = auth.uid()
    ))
  );

-- Also update the delete policy to allow group members to delete group expenses
DROP POLICY IF EXISTS "Users can delete own expenses" ON expenses;

CREATE POLICY "Users can delete own or group expenses" ON expenses
  FOR DELETE USING (
    -- Can delete own personal expense
    (created_by = auth.uid() AND group_id IS NULL)
    OR 
    -- Can delete any expense in a group they belong to
    (group_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM group_members 
      WHERE group_id = expenses.group_id AND user_id = auth.uid()
    ))
  );

-- Also need policies for expense_contributions and expense_splits for INSERT/UPDATE/DELETE
-- Allow group members to manage contributions for group expenses
DROP POLICY IF EXISTS "Expense creators can manage contributions" ON expense_contributions;

CREATE POLICY "Group members can manage contributions" ON expense_contributions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM expenses e
      WHERE e.id = expense_contributions.expense_id 
      AND (
        e.created_by = auth.uid()
        OR (e.group_id IS NOT NULL AND EXISTS (
          SELECT 1 FROM group_members 
          WHERE group_id = e.group_id AND user_id = auth.uid()
        ))
      )
    )
  );

DROP POLICY IF EXISTS "Expense creators can delete contributions" ON expense_contributions;

CREATE POLICY "Group members can delete contributions" ON expense_contributions
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM expenses e
      WHERE e.id = expense_contributions.expense_id 
      AND (
        e.created_by = auth.uid()
        OR (e.group_id IS NOT NULL AND EXISTS (
          SELECT 1 FROM group_members 
          WHERE group_id = e.group_id AND user_id = auth.uid()
        ))
      )
    )
  );

-- Similar policies for expense_splits
DROP POLICY IF EXISTS "Expense creators can manage splits" ON expense_splits;

CREATE POLICY "Group members can manage splits" ON expense_splits
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM expenses e
      WHERE e.id = expense_splits.expense_id 
      AND (
        e.created_by = auth.uid()
        OR (e.group_id IS NOT NULL AND EXISTS (
          SELECT 1 FROM group_members 
          WHERE group_id = e.group_id AND user_id = auth.uid()
        ))
      )
    )
  );

DROP POLICY IF EXISTS "Expense creators can delete splits" ON expense_splits;

CREATE POLICY "Group members can delete splits" ON expense_splits
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM expenses e
      WHERE e.id = expense_splits.expense_id 
      AND (
        e.created_by = auth.uid()
        OR (e.group_id IS NOT NULL AND EXISTS (
          SELECT 1 FROM group_members 
          WHERE group_id = e.group_id AND user_id = auth.uid()
        ))
      )
    )
  );

