-- =====================================================
-- FIX DATA SHARING - RLS POLICIES UPDATE (CORRECTED)
-- =====================================================
-- PURPOSE:
--   Enable ALL users (operators, engineers, admins) to see all
--   production plants and materials with shared inventory data
--
-- ACCESS CONTROL:
--   - ALL users can VIEW all plants and materials
--   - Column-level security handled on UI side (hide prices from operators)
--   - Only owners can INSERT/UPDATE/DELETE their own records
--   - Engineers/Admins can UPDATE/DELETE any record
--
-- ISSUE FIXED:
--   - concrete_plants: Now allows all to SELECT, but restrict INSERT/UPDATE/DELETE
--   - inventory_materials: Now allows all to SELECT, but restrict INSERT/UPDATE/DELETE
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
DROP POLICY IF EXISTS "Users can view concrete plants by role" ON concrete_plants;
DROP POLICY IF EXISTS "Users can update own concrete plants" ON concrete_plants;
DROP POLICY IF EXISTS "Users can update concrete plants by role" ON concrete_plants;
DROP POLICY IF EXISTS "Users can delete own concrete plants" ON concrete_plants;
DROP POLICY IF EXISTS "Users can delete concrete plants by role" ON concrete_plants;

-- Create new SELECT policy: ALL users can see ALL plants
CREATE POLICY "All users can view all concrete plants"
ON concrete_plants FOR SELECT
USING (true);

-- Create new INSERT policy: Users can only insert their own
CREATE POLICY "Users can insert own concrete plants"
ON concrete_plants FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create new UPDATE policy: Owners can update own, engineers/admins can update all
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

-- Create new DELETE policy: Owners can delete own, engineers/admins can delete all
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


-- Table: inventory_materials
-- ------------------------------------------------
-- Drop old restrictive policies
DROP POLICY IF EXISTS "Users can view own inventory materials" ON inventory_materials;
DROP POLICY IF EXISTS "Users can view inventory materials by role" ON inventory_materials;
DROP POLICY IF EXISTS "Users can update own inventory materials" ON inventory_materials;
DROP POLICY IF EXISTS "Users can update inventory materials by role" ON inventory_materials;
DROP POLICY IF EXISTS "Users can delete own inventory materials" ON inventory_materials;
DROP POLICY IF EXISTS "Users can delete inventory materials by role" ON inventory_materials;

-- Create new SELECT policy: ALL users can see ALL materials
CREATE POLICY "All users can view all inventory materials"
ON inventory_materials FOR SELECT
USING (true);

-- Create new INSERT policy: Users can only insert their own
CREATE POLICY "Users can insert own inventory materials"
ON inventory_materials FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create new UPDATE policy: Owners can update own, engineers/admins can update all
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

-- Create new DELETE policy: Owners can delete own, engineers/admins can delete all
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


-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================
-- After applying, run these to verify:

-- 1. Check concrete_plants policies (should see 4 policies):
SELECT schemaname, tablename, policyname, qual
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'concrete_plants'
ORDER BY policyname;

-- 2. Check inventory_materials policies (should see 4 policies):
SELECT schemaname, tablename, policyname, qual
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'inventory_materials'
ORDER BY policyname;

-- 3. Verify all policies are present:
SELECT tablename, COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('concrete_plants', 'inventory_materials')
GROUP BY tablename;

-- Expected: concrete_plants = 4, inventory_materials = 4

-- =====================================================
-- ACCESS CONTROL AFTER THIS FIX
-- =====================================================
--
-- concrete_plants table:
--   SELECT (View): ✅ ALL users (true = no row filter)
--   INSERT:       ✅ Only own records (auth.uid() = user_id)
--   UPDATE:       ✅ Own + engineers/admins
--   DELETE:       ✅ Own + engineers/admins
--
-- inventory_materials table:
--   SELECT (View): ✅ ALL users (true = no row filter)
--   INSERT:       ✅ Only own records (auth.uid() = user_id)
--   UPDATE:       ✅ Own + engineers/admins
--   DELETE:       ✅ Own + engineers/admins
--
-- Sensitive data (prices, costs) filtered on React UI side based on user role
--
-- =====================================================
