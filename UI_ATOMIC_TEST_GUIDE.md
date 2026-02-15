# UI Testing Guide: Atomic Transaction
## Task #33 - Run After Inventory Tasks Complete

---

## 📋 Overview

This guide explains how to test the atomic order approval transaction **from the app UI** (not just SQL). This is an end-to-end integration test that verifies the complete workflow.

**⚠️ PREREQUISITES:**
- ✅ Task #7: Atomic transaction RPC function deployed to Supabase
- ✅ Inventory dialog tasks (#9, #13, #14, #15) **MUST BE COMPLETE**
  - You need working "Add Material" dialog to create test data
  - You need inventory management to verify deductions

**Estimated Time:** 2-3 hours (including setup, testing, documentation)

---

## 🎯 What We're Testing

The atomic transaction ensures:
1. When an engineer approves an order, the order status changes to 'approved'
2. Inventory quantities are **automatically deducted** in the same transaction
3. Both operations succeed **or both rollback** (no partial state)
4. Operators cannot approve orders (permission check)
5. Real-time updates sync across clients

---

## 📝 Pre-Setup Checklist

Before starting UI testing, ensure:

- [ ] Migration `002_atomic_approval_transaction.sql` executed in Supabase
- [ ] Function `approve_order_with_inventory_deduction` exists
- [ ] You have **two test accounts**:
  - `engineer@test.com` (role: engineer) - can approve
  - `operator@test.com` (role: operator) - cannot approve
- [ ] All 4 "Add" dialogs in InventoryPanel are functional:
  - ✅ Add Material
  - ✅ Add Plant
  - ✅ Add Equipment
  - ✅ Add Team Member

---

## 🧪 Step-by-Step UI Test Procedure

### **Phase 1: Setup Test Data via UI**

#### 1.1 Login as Operator

1. Go to `/login`
2. Login as **operator@test.com**
3. Navigate to `/inventory`

#### 1.2 Add Test Material

1. Click "Agregar Material" button
2. Fill form:
   - **Name:** `Cemento Portland (Test)`
   - **Description:** `Test material for atomic transaction`
   - **Unit:** `kg`
   - **Current Quantity:** `1000`
   - **Min Quantity:** `100`
3. Click Save
4. **Verify:** Material appears in inventory list with quantity 1000

#### 1.3 Add Second Material

Repeat step 1.2:
   - **Name:** `Arena Silica (Test)`
   - **Quantity:** `500`
   - **Min Quantity:** `50`

#### 1.4 Create Test Order

1. Navigate to `/orders`
2. Click "Nueva Orden" or "Crear Orden"
3. Fill order form:
   - **Block Type:** `Ladrillo`
   - **Block Size:** `10x20x40 cm`
   - **Quantity:** `500`
   - **Production Date:** today
   - **Shift:** `Mañana`
   - **Materials:** Select both test materials
     - Cemento: 100 kg
     - Arena: 50 kg
4. Leave status as `Draft` initially
5. Click Save
6. **Verify:** Order appears in list with status "Draft"

#### 1.5 Submit Order

1. In the orders list, find your test order
2. Click "Editar" or open order details
3. Change status from "Draft" to "Enviada" (Submitted)
4. Click Save
5. **Verify:** Order status changed to "Enviada"

**Current State:**
- Order: `Enviada` (submitted)
- Materials: Cemento 1000kg, Arena 500kg (untouched)

---

### **Phase 2: Success Test - Atomic Approval**

#### 2.1 Login as Engineer

1. Click user avatar → Logout
2. Login as **engineer@test.com**
3. Navigate to `/orders`

**Expected:** Engineer sees all orders (including operator's)

#### 2.2 Approve Order

1. Find the test order (status: "Enviada")
2. Click "Aprobar" button (or open details and approve)
3. Confirm approval if prompted

#### 2.3 Verify Immediate UI Updates

**Within 1 second, verify:**
- ✅ Order status changes to "Aprobada" (approved) in the table
- ✅ Order disappears from "Enviada" filter (if filtered view)
- ✅ No error messages shown

#### 2.4 Verify Order Status

1. Open order details modal
2. **Verify:**
   - Status: `Aprobada`
   - Materials list still shows (100kg cemento, 50kg arena)
   - No cost data visible (operator cost hiding already implemented)

#### 2.5 Verify Inventory Deduction

1. Navigate to `/inventory`
2. Find test materials:
   - **Cemento Portland (Test)**
   - **Arena Silica (Test)**
3. **Verify quantities:**
   - Cemento: `900` (was 1000, minus 100)
   - Arena: `450` (was 500, minus 50)

✅ **SUCCESS if:** Order approved AND inventory deducted. Both happened in single transaction.

---

### **Phase 3: Rollback Test - Insufficient Inventory**

#### 3.1 Create New Order with Materials

1. Navigate to `/orders`
2. Create another order:
   - Block Type: `Ladrillo`
   - Materials: Cemento only, **200 kg**
   - Status: Save as `Draft`, then submit to `Enviada`

#### 3.2 Reduce Inventory Manually

1. Navigate to `/inventory`
2. Edit Cemento material:
   - Change quantity to `50` (only 50kg available)
   - Save
3. **Verify:** Cemento quantity = 50

#### 3.3 Attempt Approval (Should Fail)

1. Stay logged in as engineer
2. Try to approve the new order (needs 200kg, only 50 available)
3. **Observe error message:**
   - Should show: "Error al aprobar la orden: Inventory deduction errors..."
   - NOT a generic error, specific rollback reason

#### 3.4 Verify Rollback

**Check order:**
1. Refresh orders page or check real-time update
2. Order status should still be **"Enviada"** (NOT approved)
3. Open order details to confirm

**Check inventory:**
1. Navigate to `/inventory`
2. Cemento quantity should still be **50** (NOT negative, no deduction)
3. Verify NO change occurred

✅ **SUCCESS if:** Order NOT approved AND inventory unchanged. Transaction rolled back completely.

#### 3.5 Cleanup

1. Delete or revert the failed order
2. Restore Cemento quantity to 1000 (edit material)
3. This prevents interference with other tests

---

### **Phase 4: Permission Test - Operator Cannot Approve**

#### 4.1 Login as Operator

1. Logout engineer
2. Login as **operator@test.com**
3. Navigate to `/orders`

#### 4.2 Try to Approve

1. Find the first test order (should be approved already) OR create a new submitted order
2. Click "Aprobar" button

**Expected behaviors:**
- Option A (if order already approved): Error "La orden ya está aprobada"
- Option B (if new submitted order):
  - Approval request sent
  - Function rejects due to insufficient permissions
  - Error: "No tienes permisos para aprobar órdenes"
  - Order status remains "Enviada"

#### 4.3 Verify

- ✅ Operator sees permission error
- ✅ Order status unchanged
- ✅ No inventory deduction occurred

✅ **SUCCESS if:** Operator cannot approve, receives clear error

---

### **Phase 5: Real-Time Sync Test**

#### 5.1 Setup Two Browser Windows

**Window A (Operator):**
- Login as operator@test.com
- Navigate to `/orders`
- Filter to show "Enviada" orders
- Keep visible

**Window B (Engineer):**
- Login as engineer@test.com (different browser/incognito)
- Navigate to `/orders`

#### 5.2 Approve in Window B

1. In Window B, approve the operator's submitted order
2. Watch for real-time update

#### 5.3 Verify Sync in Window A

Within a few seconds:
- ✅ Window A (operator) should see order **disappear** from "Enviada" filter
- ✅ Or see status change to "Aprobada" if viewing all
- No manual refresh needed (real-time subscription works)

✅ **SUCCESS if:** Operator sees immediate update without refresh

---

### **Phase 6: Edge Cases (Optional)**

#### 6.1 Order Without Materials

1. Create order with **no materials selected**
2. Submit order
3. Approve as engineer
4. **Verify:** Approval succeeds, inventory unchanged

#### 6.2 Already Approved Order

1. Try to approve an already-approved order
2. **Verify:** Error "La orden ya está aprobada"

---

## 📊 Test Sign-Off Checklist

Mark each test as ✅ after successful verification:

- [ ] **TC-UI-01:** Success test - order approved + inventory deducted atomically
- [ ] **TC-UI-02:** Rollback test - insufficient inventory prevents approval, no state change
- [ ] **TC-UI-03:** Permission test - operator cannot approve
- [ ] **TC-UI-04:** Real-time sync - operator sees approval instantly
- [ ] **TC-UI-05:** Edge case - order without materials approves correctly
- [ ] **TC-UI-06:** Edge case - already-approved order rejected

---

## 🐛 Troubleshooting

### Error: "Function approve_order_with_inventory_deduction does not exist"
**Solution:** Database migration not deployed. Execute `src/migrations/002_atomic_approval_transaction.sql` in Supabase SQL Editor.

### Error: "permission denied for function"
**Solution:** Check function has `SECURITY DEFINER` and `GRANT EXECUTE TO authenticated`. Rerun migration.

### Order approves but inventory NOT deducted
**Possible causes:**
- Materials in order don't match inventory items (wrong materialId)
- Materials belong to different user_id (must match order owner)
- RLS blocking update on inventory_materials
- Function updated, but app cache not refreshed (restart dev server)

### No real-time updates
**Check:**
- Supabase realtime subscription enabled (should be automatic)
- ProductionOrders component has useEffect with channel subscription
- Order owner vs engineer: operator should see real-time updates to their orders

### Operator can approve order
**URGENT:** This indicates permission check failing. Verify:
- Engineer account has `role = 'engineer'` in profiles table
- Function's permission check: `SELECT 1 FROM profiles WHERE id = p_approver_id AND role IN ('engineer', 'admin')`
- RLS policies correct? (Task #3)

---

## 📈 Verification Queries (SQL)

After completing UI tests, run these in Supabase to verify atomic behavior:

```sql
-- 1. All approved orders have corresponding inventory deductions
SELECT
  po.id,
  po.status,
  po.user_id as order_owner,
  jsonb_array_length(po.materials_used) as material_count,
  im.name,
  im.current_quantity
FROM production_orders po
LEFT JOIN jsonb_array_elements(po.materials_used) AS elem ON true
LEFT JOIN inventory_materials im ON (elem->>'materialId')::uuid = im.id
WHERE po.status = 'approved'
ORDER BY po.id, im.name;

-- 2. Check for any negative inventory (should be 0)
SELECT COUNT(*) as negative_count
FROM inventory_materials
WHERE current_quantity < 0;
-- Expected: 0

-- 3. Verify no partial approvals (draft orders with no materials used deducted)
SELECT
  COUNT(*) as total_orders,
  COUNT(*) FILTER (WHERE status = 'approved') as approved,
  COUNT(*) FILTER (WHERE status = 'submitted') as submitted
FROM production_orders
WHERE id IN ('your-test-order-uuids');
```

---

## 📝 Documentation Requirements

After completing Task #33:

1. **Update `ATOMIC_TRANSACTION_TESTING_GUIDE.md`** with:
   - UI test results
   - Any issues discovered
   - Screenshots (if helpful)

2. **Update `active-tasks.md`:**
   - Mark Task #33 as complete
   - Add completion date: 2026-02-XX
   - Note any follow-up items

3. **Update `SECURITY_FIRST_SUMMARY.md`:**
   - Atomic transaction verification status: ✅ Complete
   - Tier 1 completion percentage

4. **Create test report** (optional but recommended):
   - `docs/testing/atomic-transaction-ui-test-report.md`
   - Include timestamps, tester name, issues found (if any)

---

## ⏱️ Time Estimation

| Step | Duration |
|------|----------|
| Setup test accounts & data | 30 min |
| Success test with verification | 45 min |
| Rollback test | 30 min |
| Permission test | 20 min |
| Real-time sync test | 15 min |
| Edge cases & cleanup | 20 min |
| Documentation | 20 min |
| **Total** | **2-3 hours** |

---

## 🎯 Success Criteria

Task #33 is **complete** when:

1. ✅ All 6 test cases passed (TC-UI-01 through TC-UI-06)
2. ✅ No errors observed during normal workflow
3. ✅ Atomic behavior confirmed (all-or-nothing)
4. ✅ Real-time sync working
5. ✅ Documentation updated
6. ✅ Task tracking updated (active-tasks.md)

---

**⚠️ Remember:** Do NOT start Task #33 until Tasks #9, #13, #14, and #15 (all 4 inventory add dialogs) are fully implemented and functional. You need those dialogs to create test data efficiently.

**When Ready:** Schedule 2-3 hours of focused testing time. Use test accounts, NOT production data.

---

**Created:** 2026-02-15
**Related Tasks:** #7 (implementation), #9, #13, #14, #15 (prerequisites)
**Test Guide Version:** 1.0
