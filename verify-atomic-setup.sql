-- =====================================================
-- ATOMIC TRANSACTION VERIFICATION SCRIPT
-- Run this in Supabase SQL Editor to verify the setup
--
-- This script checks:
--  1. Function exists and has correct signature
--  2. Function has SECURITY DEFINER
--  3. GRANT EXECUTE is in place
--  4. Test data is ready
-- =====================================================

-- =====================================================
-- 1. CHECK FUNCTION EXISTS
-- =====================================================
SELECT
  routine_name,
  routine_type,
  security_type,
  data_type as return_type
FROM information_schema.routines
WHERE routine_name = 'approve_order_with_inventory_deduction'
  AND routine_schema = 'public';

-- Expected: 1 row with name='approve_order_with_inventory_deduction', security_type='DEFINER'

-- =====================================================
-- 2. CHECK FUNCTION PARAMETERS
-- =====================================================
SELECT
  parameter_name,
  data_type,
  parameter_mode
FROM information_schema.parameters
WHERE specific_name = (
  SELECT specific_name
  FROM information_schema.routines
  WHERE routine_name = 'approve_order_with_inventory_deduction'
    AND routine_schema = 'public'
)
ORDER BY ordinal_position;

-- Expected: 2 parameters
--   p_order_id: uuid, IN
--   p_approver_id: uuid, IN

-- =====================================================
-- 3. CHECK EXECUTE PERMISSIONS
-- =====================================================
SELECT
  grantee,
  privilege_type
FROM information_schema.usage_privileges
WHERE routine_name = 'approve_order_with_inventory_deduction'
  AND routine_schema = 'public';

-- Expected: GRANT EXECUTE TO authenticated (or specific role)

-- =====================================================
-- 4. VERIFY REQUIRED TABLES EXIST
-- =====================================================
SELECT
  table_name,
  row_security as rls_enabled
FROM information_schema.tables
WHERE table_name IN ('production_orders', 'inventory_materials', 'profiles')
  AND table_schema = 'public'
ORDER BY table_name;

-- Expected: All 3 tables with RLS enabled (row_security = true)

-- =====================================================
-- 5. CHECK RLS POLICIES ON CRITICAL TABLES
-- =====================================================
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename IN ('production_orders', 'inventory_materials', 'profiles')
  AND schemaname = 'public'
ORDER BY tablename, policyname;

-- Expected: Multiple policies for each table ensuring row-level access control

-- =====================================================
-- 6. PREPARE TEST DATA (run only once)
-- =====================================================
-- Create test users if they don't exist
-- INSERT INTO profiles (id, role, company_name, created_at, updated_at)
-- VALUES
--   ('11111111-1111-1111-1111-111111111111', 'engineer', 'Test Engineer', NOW(), NOW()),
--   ('22222222-2222-2222-2222-222222222222', 'operator', 'Test Operator', NOW(), NOW())
-- ON CONFLICT (id) DO NOTHING;

-- Create test materials for operator
-- INSERT INTO inventory_materials (id, user_id, name, description, unit, current_quantity, min_quantity, created_at, updated_at)
-- VALUES
--   ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '22222222-2222-2222-2222-222222222222', 'Cemento Portland', 'Cemento tipo I', 'kg', 1000, 100, NOW(), NOW()),
--   ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '22222222-2222-2222-2222-222222222222', 'Arena silica', 'Arena fina', 'kg', 500, 50, NOW(), NOW())
-- ON CONFLICT (id) DO UPDATE SET current_quantity = EXCLUDED.current_quantity, updated_at = NOW();

-- Create test order
-- INSERT INTO production_orders (id, user_id, created_by_name, block_type, block_size, quantity_produced, production_date, production_shift, status, materials_used, total_cost, created_at, updated_at)
-- VALUES (
--   'cccccccc-cccc-cccc-cccc-cccccccccccc',
--   '22222222-2222-2222-2222-222222222222',
--   'Test Operator',
--   'Ladrillo',
--   '10x20x40 cm',
--   500,
--   CURRENT_DATE,
--   'Mañana',
--   'submitted',
--   '[{"materialId":"aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa","quantity":100},{"materialId":"bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb","quantity":50}]'::jsonb,
--   15000,
--   NOW(),
--   NOW()
-- )
-- ON CONFLICT (id) DO UPDATE SET
--   status = 'submitted',
--   materials_used = EXCLUDED.materials_used,
--   updated_at = NOW();

-- =====================================================
-- 7. QUICK TEST: Manual RPC call
-- =====================================================
-- After running the test data setup above, execute:
-- SELECT approve_order_with_inventory_deduction(
--   'cccccccc-cccc-cccc-cccc-cccccccccccc',
--   '11111111-1111-1111-1111-111111111111'
-- ) as result;

-- Expected result:
-- {"success":true,"approved":true,"order_id":"cccccccc-...","materials_deducted":2}

-- Then verify:
-- SELECT status FROM production_orders WHERE id = 'cccccccc-cccc-cccc-cccc-cccccccccccc';
-- -- Should return 'approved'

-- SELECT name, current_quantity FROM inventory_materials
-- WHERE user_id = '22222222-2222-2222-2222-222222222222';
-- -- Should return: Cemento = 900 (1000-100), Arena = 450 (500-50)
