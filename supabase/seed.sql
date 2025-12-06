-- SplitWiser Seed Data
-- Run this after schema.sql

-- Mock Users (for POC)
INSERT INTO users (id, name, avatar_color) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Israel', '#6366f1'),
  ('22222222-2222-2222-2222-222222222222', 'Sarah', '#ec4899'),
  ('33333333-3333-3333-3333-333333333333', 'David', '#10b981'),
  ('44444444-4444-4444-4444-444444444444', 'Maya', '#f59e0b')
ON CONFLICT (id) DO NOTHING;

-- System Categories
INSERT INTO categories (id, name, icon, color, is_system, sort_order) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Food & Dining', 'utensils', '#f97316', true, 1),
  ('00000000-0000-0000-0000-000000000002', 'Transport', 'car', '#3b82f6', true, 2),
  ('00000000-0000-0000-0000-000000000003', 'Entertainment', 'film', '#a855f7', true, 3),
  ('00000000-0000-0000-0000-000000000004', 'Shopping', 'shopping-bag', '#ec4899', true, 4),
  ('00000000-0000-0000-0000-000000000005', 'Bills & Utilities', 'receipt', '#64748b', true, 5),
  ('00000000-0000-0000-0000-000000000006', 'Health', 'heart-pulse', '#ef4444', true, 6),
  ('00000000-0000-0000-0000-000000000007', 'Travel', 'plane', '#06b6d4', true, 7),
  ('00000000-0000-0000-0000-000000000008', 'Groceries', 'shopping-cart', '#22c55e', true, 8),
  ('00000000-0000-0000-0000-000000000009', 'Housing', 'home', '#8b5cf6', true, 9),
  ('00000000-0000-0000-0000-000000000010', 'Other', 'more-horizontal', '#6b7280', true, 10)
ON CONFLICT (id) DO NOTHING;

