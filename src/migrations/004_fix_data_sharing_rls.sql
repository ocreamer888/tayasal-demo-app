-- =====================================================
-- FIX DATA SHARING - RLS POLICIES UPDATE
-- =====================================================
-- PURPOSE:
--   Enable engineers and admins to see all production plants
--   and materials, while operators see only their own
--
-- ISSUE FIXED:
--   - concrete_plants: was `auth.uid() = user_id` (operators only)
--   - inventory_materials: was `auth.uid() = user_id` (operators only)
--
--   Now uses role-based access like production_orders:
--   - Operators can see/update/delete only their own records
--   - Engineers/Admins can see/update/delete ALL records
--
-- EXECUTION:
--   1. Copy all statements
--   2. Paste into Supabase SQL Editor
--   3. Execute to apply policy changes
-- =====================================================

-- Table: concrete_plants
-- ------------------------------------------------
-- Drop old restrictive policies
DROP POLICY IF EXISTS "Users can view own concrete plants" ON concrete_plants;
DROP POLICY IF EXISTS "Users can update own concrete plants" ON concrete_plants;
DROP POLICY IF EXISTS "Users can delete own concrete plants" ON concrete_plants;

-- Create new role-based SELECT policy
CREATE POLICY "Users can view concrete plants by role"
ON concrete_plants FOR SELECT
USING (
  auth.uid() = user_id
  OR EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('engineer', 'admin')
  )
);

-- Create new role-based UPDATE policy
CREATE POLICY "Users can update concrete plants by role"
ON concrete_plants FOR UPDATE
USING (
  auth.uid() = user_id
  OR EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('engineer', 'admin')
  )
);

-- Create new role-based DELETE policy
CREATE POLICY "Users can delete concrete plants by role"
ON concrete_plants FOR DELETE
USING (
  auth.uid() = user_id
  OR EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('engineer', 'admin')
  )
);

-- INSERT policy remains the same (users can only insert their own)
-- No changes needed for "Users can insert own concrete plants"


-- Table: inventory_materials
-- ------------------------------------------------
-- Drop old restrictive policies
DROP POLICY IF EXISTS "Users can view own inventory materials" ON inventory_materials;
DROP POLICY IF EXISTS "Users can update own inventory materials" ON inventory_materials;
DROP POLICY IF EXISTS "Users can delete own inventory materials" ON inventory_materials;

-- Create new role-based SELECT policy
CREATE POLICY "Users can view inventory materials by role"
ON inventory_materials FOR SELECT
USING (
  auth.uid() = user_id
  OR EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('engineer', 'admin')
  )
);

-- Create new role-based UPDATE policy
CREATE POLICY "Users can update inventory materials by role"
ON inventory_materials FOR UPDATE
USING (
  auth.uid() = user_id
  OR EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('engineer', 'admin')
  )
);

-- Create new role-based DELETE policy
CREATE POLICY "Users can delete inventory materials by role"
ON inventory_materials FOR DELETE
USING (
  auth.uid() = user_id
  OR EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('engineer', 'admin')
  )
);

-- INSERT policy remains the same (users can only insert their own)
-- No changes needed for "Users can insert own inventory materials"


-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================
-- After applying, run these to verify:

-- 1. Check updated policies for concrete_plants:
SELECT schemaname, tablename, policyname, qual
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'concrete_plants'
ORDER BY policyname;

-- 2. Check updated policies for inventory_materials:
SELECT schemaname, tablename, policyname, qual
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'inventory_materials'
ORDER BY policyname;

-- 3. Verify all policies are present (should be 4 for each table):
SELECT tablename, COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('concrete_plants', 'inventory_materials')
GROUP BY tablename;

-- =====================================================
-- END OF MIGRATION
-- =====================================================
