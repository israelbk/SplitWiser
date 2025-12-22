-- Fix category RLS policy to allow public read
-- Categories are system data that should be readable by anyone

-- Drop the current restrictive policy
DROP POLICY IF EXISTS "Authenticated users can view categories" ON categories;

-- Create a new policy that allows public read (for DEV MODE compatibility and general access)
CREATE POLICY "Anyone can view categories" ON categories
  FOR SELECT USING (true);

-- Keep write operations restricted to authenticated users
CREATE POLICY "Authenticated users can create categories" ON categories
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update categories" ON categories
  FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete categories" ON categories
  FOR DELETE USING (auth.uid() IS NOT NULL);

