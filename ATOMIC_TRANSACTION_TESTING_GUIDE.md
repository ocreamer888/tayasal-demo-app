# Atomic Transaction Testing Guide
## Task #7: Verify `approve_order_with_inventory_deduction` Function

---

## 🎯 Overview

This guide tests the **atomic order approval transaction** that ensures:
1. Order status changes to `'approved'`
2. Inventory quantities are deducted correctly from the **order owner's** inventory
3. **All operations succeed or all rollback** (ACID compliance)
4. Permission checks work (only engineers/admins can approve)
5. Row locking prevents race conditions

**Function location:** `src/migrations/002_atomic_approval_transaction.sql`
**Integration:** `src/lib/hooks/useProductionOrders.ts` (lines 364-411)

---

## 📋 Prerequisites

### 1. Ensure Function Exists in Supabase

```sql
-- Run in Supabase SQL Editor
SELECT
  routine_name,
  routine_type,
  security_type
FROM information_schema.routines
WHERE routine_name = 'approve_order_with_inventory_deduction'
  AND routine_schema = 'public';
```

**Expected result:** 1 row returned with `SECURITY DEFINER`

### 2. If Function Missing → Execute Migration

```bash
# Copy contents of src/migrations/002_atomic_approval_transaction.sql
# Paste into Supabase SQL Editor and run
```

---

## 🧪 Test Data Setup

### Step 1: Create Test Users (if not existing)

```sql
-- Get or create an engineer user
INSERT INTO profiles (id, email, role, full_name, created_at, updated_at)
VALUES (
  '11111111-1111-1111-1111-111111111111',
  'engineer@test.com',
  'engineer',
  'Test Engineer',
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Get or create an operator user
INSERT INTO profiles (id, email, role, full_name, created_at, updated_at)
VALUES (
  '22222222-2222-2222-2222-222222222222',
  'operator@test.com',
  'operator',
  'Test Operator',
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;
```

### Step 2: Create Test Materials

```sql
-- Insert materials for operator (owner)
INSERT INTO inventory_materials (id, user_id, name, description, unit, current_quantity, min_quantity, created_at, updated_at)
VALUES
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    '22222222-2222-2222-2222-222222222222', -- operator's user_id
    'Cemento Portland',
    'Cemento tipo I para bloques',
    'kg',
    1000, -- Starting quantity
    100,
    NOW(),
    NOW()
  ),
  (
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    '22222222-2222-2222-2222-222222222222',
    'Arena silica',
    'Arena fina para concreto',
    'kg',
    500,
    50,
    NOW(),
    NOW()
  )
ON CONFLICT (id) DO UPDATE SET
  current_quantity = EXCLUDED.current_quantity,
  updated_at = NOW();
```

### Step 3: Create Test Order with Materials

```sql
-- Create a submitted order with materials_used
INSERT INTO production_orders (
  id,
  user_id,
  created_by_name,
  block_type,
  block_size,
  quantity_produced,
  production_date,
  production_shift,
  status,
  materials_used,
  total_cost,
  created_at,
  updated_at
) VALUES (
  'cccccccc-cccc-cccc-cccc-cccccccccccc',
  '22222222-2222-2222-2222-222222222222', -- operator owns this order
  'Test Operator',
  'Ladrillo',
  '10x20x40 cm',
  500,
  CURRENT_DATE,
  'Mañana',
  'submitted', -- Must be 'submitted' to approve
  '[{"materialId": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa", "quantity": 100}, {"materialId": "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb", "quantity": 50}]'::jsonb,
  15000,
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  status = 'submitted',
  materials_used = EXCLUDED.materials_used,
  updated_at = NOW();
```

**Note:** This order uses 100kg cement + 50kg sand. Inventory has 1000kg and 500kg respectively → sufficient stock.

### Step 4: Verify Test Data

```sql
-- Check order
SELECT id, user_id, status, materials_used FROM production_orders
WHERE id = 'cccccccc-cccc-cccc-cccc-cccccccccccc';

-- Check inventory before deduction
SELECT id, name, current_quantity FROM inventory_materials
WHERE user_id = '22222222-2222-2222-2222-222222222222';
```

**Expected:**
- Order: status = 'submitted', materials_used array with 2 items
- Inventory: cement = 1000, sand = 500

---

## ✅ Test Case 1: Successful Approval

**Goal:** Verify order approval + inventory deduction works atomically.

```sql
-- Execute as engineer (use engineer's user_id)
SELECT approve_order_with_inventory_deduction(
  'cccccccc-cccc-cccc-cccc-cccccccccccc', -- order_id
  '11111111-1111-1111-1111-111111111111'  -- approver_id (engineer)
) AS result;
```

**Expected result:**
```json
{
  "success": true,
  "approved": true,
  "order_id": "cccccccc-cccc-cccc-cccc-cccccccccccc",
  "materials_deducted": 2
}
```

**Verify:**
```sql
-- Check order status
SELECT status FROM production_orders WHERE id = 'cccccccc-cccc-cccc-cccc-cccccccccccc';
-- Expected: 'approved'

-- Check inventory after deduction
SELECT name, current_quantity FROM inventory_materials
WHERE user_id = '22222222-2222-2222-2222-222222222222';
-- Expected: cement = 900 (1000-100), sand = 450 (500-50)
```

---

## ❌ Test Case 2: Rollback on Insufficient Inventory

**Goal:** Verify transaction rolls back if inventory is insufficient.

### Setup: Reduce inventory first
```sql
UPDATE inventory_materials
SET current_quantity = 10
WHERE id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
-- Cement now only 10kg, but order needs 100kg

-- Verify
SELECT name, current_quantity FROM inventory_materials
WHERE user_id = '22222222-2222-2222-2222-222222222222';
```

### Test approval
```sql
SELECT approve_order_with_inventory_deduction(
  'cccccccc-cccc-cccc-cccc-cccccccccccc',
  '11111111-1111-1111-1111-111111111111'
) AS result;
```

**Expected result:** Error
```json
{
  "success": false,
  "error": "Inventory deduction errors: Material no encontrado o sin acceso: aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
  "code": "TRANSACTION_ERROR"
}
```
*Note: Materials might be locked/updated concurrently, but inventory insufficient should trigger error.*

**Verify rollback:**
```sql
-- Order status should still be 'submitted'
SELECT status FROM production_orders WHERE id = 'cccccccc-cccc-cccc-cccc-cccccccccccc';
-- Expected: 'submitted' (NOT 'approved')

-- Inventory should be unchanged (still 10)
SELECT current_quantity FROM inventory_materials
WHERE id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
-- Expected: 10 (not negative)
```

**Reset inventory after test:**
```sql
UPDATE inventory_materials
SET current_quantity = 1000
WHERE id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
```

---

## ❌ Test Case 3: Rollback on Missing Material

**Goal:** Order references material_id that doesn't exist in inventory.

### Setup: Modify order to reference non-existent material
```sql
UPDATE production_orders
SET materials_used = '[{"materialId": "zzzzzzzz-zzzz-zzzz-zzzz-zzzzzzzzzzzz", "quantity": 50}]'::jsonb
WHERE id = 'cccccccc-cccc-cccc-cccc-cccccccccccc';

-- Verify
SELECT materials_used FROM production_orders WHERE id = 'cccccccc-cccc-cccc-cccc-cccccccccccc';
```

### Test
```sql
SELECT approve_order_with_inventory_deduction(
  'cccccccc-cccc-cccc-cccc-cccccccccccc',
  '11111111-1111-1111-1111-111111111111'
) AS result;
```

**Expected result:** Error with deduction error
```json
{
  "success": false,
  "error": "Inventory deduction errors: Material no encontrado o sin acceso: zzzzzzzz-zzzz-zzzz-zzzz-zzzzzzzzzzzz",
  "code": "TRANSACTION_ERROR"
}
```

**Verify rollback:**
```sql
-- Order status unchanged
SELECT status FROM production_orders WHERE id = 'cccccccc-cccc-cccc-cccc-cccccccccccc';
-- Expected: 'submitted'

-- Inventory quantities unchanged
SELECT current_quantity FROM inventory_materials
WHERE user_id = '22222222-2222-2222-2222-222222222222';
```

### Reset order materials
```sql
UPDATE production_orders
SET materials_used = '[{"materialId": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa", "quantity": 100}, {"materialId": "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb", "quantity": 50}]'::jsonb
WHERE id = 'cccccccc-cccc-cccc-cccc-cccccccccccc';
```

---

## ✅ Test Case 4: Order Without Materials

**Goal:** Orders with empty materials_used should approve without deduction.

### Setup: Order with no materials
```sql
-- Update order to have empty materials array
UPDATE production_orders
SET materials_used = '[]'::jsonb
WHERE id = 'cccccccc-cccc-cccc-cccc-cccccccccccc';

-- Verify
SELECT materials_used FROM production_orders WHERE id = 'cccccccc-cccc-cccc-cccc-cccccccccccc';
```

### Test
```sql
SELECT approve_order_with_inventory_deduction(
  'cccccccc-cccc-cccc-cccc-cccccccccccc',
  '11111111-1111-1111-1111-111111111111'
) AS result;
```

**Expected result:**
```json
{
  "success": true,
  "approved": true,
  "order_id": "cccccccc-cccc-cccc-cccc-cccccccccccc",
  "materials_deducted": 0
}
```

**Verify:**
```sql
-- Order approved
SELECT status FROM production_orders WHERE id = 'cccccccc-cccc-cccc-cccc-cccccccccccc';
-- Expected: 'approved'

-- Inventory unchanged
SELECT current_quantity FROM inventory_materials
WHERE user_id = '22222222-2222-2222-2222-222222222222';
-- Expected: Same as before (900 and 450 after previous tests, or reset to 1000/500)
```

---

## 🚫 Test Case 5: Permission Enforcement

**Goal:** Only engineers/admins can approve.

### Test as Operator (should fail)
```sql
SELECT approve_order_with_inventory_deduction(
  'cccccccc-cccc-cccc-cccc-cccccccccccc',
  '22222222-2222-2222-2222-222222222222'  -- operator's ID (not engineer)
) AS result;
```

**Expected result:**
```json
{
  "success": false,
  "error": "No tienes permisos para aprobar órdenes",
  "code": "INSUFFICIENT_PERMISSIONS"
}
```

**Verify:** Order status unchanged.

---

## 🚫 Test Case 6: Invalid Status Transitions

### Test 6a: Already Approved
```sql
-- First, approve the order (if not already approved)
-- Skip if already approved from previous tests, or reset:
UPDATE production_orders SET status = 'approved' WHERE id = 'cccccccc-cccc-cccc-cccc-cccccccccccc';

-- Try to approve again
SELECT approve_order_with_inventory_deduction(
  'cccccccc-cccc-cccc-cccc-cccccccccccc',
  '11111111-1111-1111-1111-111111111111'
) AS result;
```

**Expected result:**
```json
{
  "success": false,
  "error": "La orden ya está aprobada",
  "code": "ALREADY_APPROVED"
}
```

### Test 6b: Draft Order (not 'submitted')
```sql
-- Set order to draft
UPDATE production_orders SET status = 'draft' WHERE id = 'cccccccc-cccc-cccc-cccc-cccccccccccc';

SELECT approve_order_with_inventory_deduction(
  'cccccccc-cccc-cccc-cccc-cccccccccccc',
  '11111111-1111-1111-1111-111111111111'
) AS result;
```

**Expected result:**
```json
{
  "success": false,
  "error": "Solo se pueden aprobar órdenes en estado \"Enviada\"",
  "code": "INVALID_STATUS"
}
```

### Reset to submitted for remaining tests
```sql
UPDATE production_orders SET status = 'submitted' WHERE id = 'cccccccc-cccc-cccc-cccc-cccccccccccc';
```

---

## 🚫 Test Case 7: Non-Existent Order

```sql
SELECT approve_order_with_inventory_deduction(
  'ffffffff-ffff-ffff-ffff-ffffffffffff', -- fake order ID
  '11111111-1111-1111-1111-111111111111'
) AS result;
```

**Expected result:**
```json
{
  "success": false,
  "error": "Orden no encontrada",
  "code": "ORDER_NOT_FOUND"
}
```

---

## 🔒 Test Case 8: Row Locking (Concurrent Approvals)

**Goal:** Verify that concurrent approval attempts don't cause race conditions.

This test requires running two queries simultaneously. In Supabase SQL Editor, you can open two tabs:

### Tab 1 (Start transaction)
```sql
BEGIN;
-- Call function (will lock the order row)
SELECT approve_order_with_inventory_deduction(
  'cccccccc-cccc-cccc-cccc-cccccccccccc',
  '11111111-1111-1111-1111-111111111111'
) AS result;
-- Don't COMMIT yet, keep transaction open
```

### Tab 2 (While Tab 1 is still open)
```sql
-- Try concurrent approval
SELECT approve_order_with_inventory_deduction(
  'cccccccc-cccc-cccc-cccc-cccccccccccc',
  '11111111-1111-1111-1111-111111111111'
) AS result;
```

**Expected result Tab 2:** Should wait (row locked) or eventually fail. In practice, PostgreSQL will wait then process serially. First transaction commits, second may fail with "already approved" error.

**Cleanup:**
```sql
-- In Tab 1
COMMIT; -- or ROLLBACK;
```

---

## 🔗 Test Case 9: App Integration (Manual UI Test)

**Follow TESTING_PLAN.md TC-ORDERS-06**

1. Login as engineer
2. Navigate to `/orders`
3. Find an order with status 'submitted' (should have materials)
4. Click "Aprobar" in modal
5. Verify:
   - ✅ Order status changes to 'approved' immediately
   - ✅ Order disappears from 'submitted' filter
   - ✅ Inventory page shows deducted quantities
   - ✅ Real-time sync visible if operator has open tab

---

## 🧹 Cleanup Script

After all tests, reset test data:

```sql
-- Reset inventory to full quantities
UPDATE inventory_materials
SET current_quantity = 1000
WHERE id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

UPDATE inventory_materials
SET current_quantity = 500
WHERE id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

-- Reset order to submitted with original materials
UPDATE production_orders
SET
  status = 'submitted',
  materials_used = '[{"materialId": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa", "quantity": 100}, {"materialId": "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb", "quantity": 50}]'::jsonb,
  updated_at = NOW()
WHERE id = 'cccccccc-cccc-cccc-cccc-cccccccccccc';

-- Optional: delete test order entirely
-- DELETE FROM production_orders WHERE id = 'cccccccc-cccc-cccc-cccc-cccccccccccc';
```

---

## 📊 Verification Checklist

Run this after testing to confirm atomic behavior:

```sql
-- Atomic check 1: All approved orders have corresponding inventory deductions
SELECT
  po.id AS order_id,
  po.status,
  po.user_id AS order_owner,
  jsonb_array_length(po.materials_used) AS material_count,
  im.name,
  im.current_quantity
FROM production_orders po
LEFT JOIN jsonb_array_elements(po.materials_used) AS elem ON true
LEFT JOIN inventory_materials im ON (elem->>'materialId')::uuid = im.id
WHERE po.status = 'approved'
ORDER BY po.id, im.name;
```

**Expected:** For each approved order, inventory quantities should be **reduced** by the material quantities. No negative inventory should exist.

```sql
-- Atomic check 2: No partial deductions
SELECT
  COUNT(*) AS total_orders,
  COUNT(*) FILTER (WHERE status = 'approved') AS approved_orders,
  COUNT(*) FILTER (WHERE status = 'submitted') AS submitted_orders
FROM production_orders
WHERE id = 'cccccccc-cccc-cccc-cccc-cccccccccccc';
```

---

## ⚠️ Known Edge Cases & Considerations

1. **Negative Inventory Prevention:** The transaction **does not** check for negative inventory explicitly. It relies on:
   - `AND user_id = v_order.user_id` ensures correct ownership
   - Database constraint or trigger could prevent negative quantities (add as enhancement)

2. **Material Ownership:** Materials must belong to the **order owner** (`user_id = v_order.user_id`). If material belongs to someone else, deduction fails → rollback.

3. **Concurrent Modifications:** Row locking (`FOR UPDATE`) prevents concurrent approval of same order, but inventory rows are also locked during UPDATE automatically (PostgreSQL row-level locks).

4. **Performance:** Whole operation runs in single transaction. For orders with many materials, could take time. Consider optimizing with batch updates if needed.

5. **Audit Logging:** Not implemented. Should add audit trail (Task #30).

---

## 🐛 Troubleshooting

### Error: "function approve_order_with_inventory_dedction(uuid, uuid) does not exist"
- **Solution:** Ensure you executed `002_atomic_approval_transaction.sql` in Supabase

### Error: "permission denied for function approve_order_with_inventory_deduction"
- **Solution:** Run `GRANT EXECUTE ON FUNCTION public.approve_order_with_inventory_deduction(uuid, uuid) TO authenticated;`
- Or create the function with `SECURITY DEFINER` (already in script)

### Order status not changing
- **Check:** Order must be `'submitted'`, not `'draft'` or `'approved'`
- **Check:** Approver must be engineer/admin (check `profiles.role`)

### Inventory not changing
- **Check:** Materials in `materials_used` must have `materialId` matching `inventory_materials.id`
- **Check:** Material must belong to order owner (`user_id` match)
- **Check:** RLS policies allow update on `inventory_materials`

---

## ✅ Test Sign-Off

| Test Case | Status | Notes |
|-----------|--------|-------|
| TC-ATOMIC-01: Successful approval | ☐ | |
| TC-ATOMIC-02: Rollback on insufficient inventory | ☐ | |
| TC-ATOMIC-03: Rollback on missing material | ☐ | |
| TC-ATOMIC-04: Order without materials | ☐ | |
| TC-ATOMIC-05: Permission enforcement | ☐ | |
| TC-ATOMIC-06: Invalid status | ☐ | |
| TC-ATOMIC-07: Non-existent order | ☐ | |
| TC-ATOMIC-08: Row locking | ☐ | Optional, advanced |
| TC-ATOMIC-09: App integration | ☐ | UI test |

**Tester:** ___________________
**Date:** ___________________
**Supabase Project:** ___________________

---

## 📚 References

- Migration file: `src/migrations/002_atomic_approval_transaction.sql`
- Integration code: `src/lib/hooks/useProductionOrders.ts:364-411`
- Security requirements: `rules/CYBERSECURITY_MASTERY.md` (Task #7)
- Testing plan: `TESTING_PLAN.md` (TC-ORDERS-06)

---

**⚠️ CRITICAL:** This function is the backbone of inventory integrity. All tests **must** pass before production deployment. Any failure indicates potential data corruption risk.
