-- =====================================================
-- RLS POLICIES BACKUP - Exported 2026-02-09
-- This file contains the expected RLS policy definitions
-- from SUPABASE_SCHEMA.sql (lines 249-286)
--
-- PURPOSE:
--   - Backup of RLS configuration before making changes
--   - Reference for verification in Supabase Dashboard
--   - Can be executed to restore policies if accidentally deleted
--
-- USAGE:
--   1. Copy all statements
--   2. Paste into Supabase SQL Editor
--   3. Execute to recreate policies
--
-- NOTE: RLS must already be ENABLED on tables before running these
--       (ENABLE ROW LEVEL SECURITY statements are in main schema)
-- =====================================================

-- Table: profiles
-- ------------------------------------------------
CREATE POLICY IF NOT EXISTS "Users can view own profile"
ON profiles FOR SELECT
USING (auth.uid() = id);

CREATE POLICY IF NOT EXISTS "Users can update own profile"
ON profiles FOR UPDATE
USING (auth.uid() = id);

CREATE POLICY IF NOT EXISTS "Users can insert own profile"
ON profiles FOR INSERT
WITH CHECK (auth.uid() = id);

-- Table: concrete_plants
-- ------------------------------------------------
CREATE POLICY IF NOT EXISTS "Users can view own concrete plants"
ON concrete_plants FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can insert own concrete plants"
ON concrete_plants FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can update own concrete plants"
ON concrete_plants FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can delete own concrete plants"
ON concrete_plants FOR DELETE
USING (auth.uid() = user_id);

-- Table: equipments
-- ------------------------------------------------
CREATE POLICY IF NOT EXISTS "Users can view own equipments"
ON equipments FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can insert own equipments"
ON equipments FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can update own equipments"
ON equipments FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can delete own equipments"
ON equipments FOR DELETE
USING (auth.uid() = user_id);

-- Table: team_members
-- ------------------------------------------------
CREATE POLICY IF NOT EXISTS "Users can view own team members"
ON team_members FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can insert own team members"
ON team_members FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can update own team members"
ON team_members FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can delete own team members"
ON team_members FOR DELETE
USING (auth.uid() = user_id);

-- Table: inventory_materials
-- ------------------------------------------------
CREATE POLICY IF NOT EXISTS "Users can view own inventory materials"
ON inventory_materials FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can insert own inventory materials"
ON inventory_materials FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can update own inventory materials"
ON inventory_materials FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can delete own inventory materials"
ON inventory_materials FOR DELETE
USING (auth.uid() = user_id);

-- Table: production_orders (ROLE-BASED ACCESS)
-- ------------------------------------------------
-- Operators: can see/update/delete only their own orders
-- Engineers/Admins: can see/update/delete ALL orders

CREATE POLICY IF NOT EXISTS "Operators can view own production orders"
ON production_orders FOR SELECT
USING (
  auth.uid() = user_id
  OR EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('engineer', 'admin')
  )
);

CREATE POLICY IF NOT EXISTS "Users can insert own production orders"
ON production_orders FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can update own production orders"
ON production_orders FOR UPDATE
USING (
  auth.uid() = user_id
  OR EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('engineer', 'admin')
  )
);

CREATE POLICY IF NOT EXISTS "Users can delete own production orders"
ON production_orders FOR DELETE
USING (
  auth.uid() = user_id
  OR EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('engineer', 'admin')
  )
);

-- =====================================================
-- END OF RLS POLICIES BACKUP
-- =====================================================
--
-- Verification Queries (run after applying):
--
-- 1. Check all policies exist:
--    SELECT schemaname, tablename, policyname
--    FROM pg_policies
--    WHERE schemaname = 'public'
--    ORDER BY tablename, policyname;
--
-- 2. Count policies per table (should match above):
--    SELECT tablename, COUNT(*) as policy_count
--    FROM pg_policies
--    WHERE schemaname = 'public'
--    GROUP BY tablename
--    ORDER BY tablename;
--
-- Expected counts:
--   concrete_plants: 4
--   equipments: 4
--   inventory_materials: 4
--   profiles: 3
--   production_orders: 4
--   team_members: 4
--   TOTAL: 23 policies
