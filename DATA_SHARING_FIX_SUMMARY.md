# Data Sharing Fix - Concrete Plants & Inventory Materials

**Date:** February 20, 2026
**Status:** ✅ IMPLEMENTED
**Build Status:** ✅ PASSING

---

## Problem Identified

Production plants and materials were **not being reflected across accounts**. Each user could only see their own records, even if they had admin/engineer roles that should grant access to all data.

### Root Causes

#### 1. **Overly Restrictive RLS Policies** ⚠️

The Row-Level Security (RLS) policies for `concrete_plants` and `inventory_materials` used only **user-id matching**, preventing role-based access:

```sql
-- ❌ OLD POLICY (concrete_plants)
CREATE POLICY "Users can view own concrete plants"
ON concrete_plants FOR SELECT
USING (auth.uid() = user_id);  -- Only own records!
```

**Issue:** Even though engineers/admins tried to fetch all records, the database RLS blocked access because the authenticated user's ID didn't match the `user_id` column.

**Contrast with production_orders (correct implementation):**
```sql
-- ✅ CORRECT POLICY (production_orders)
CREATE POLICY "Operators can view own production orders"
ON production_orders FOR SELECT
USING (
  auth.uid() = user_id
  OR EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('engineer', 'admin')
  )
);
```

#### 2. **Client-Side Implementation Issues**

**useConcretePlants hook:** Explicitly filtered by user_id, never tried to fetch shared data:
```typescript
// ❌ OLD CODE
const { data } = await supabase
  .from('concrete_plants')
  .select('*')
  .eq('user_id', userId)  // Always filters by current user!
  .order('name', { ascending: true });
```

**useInventoryMaterials hook:** Had role-based logic on client side, but RLS blocked it:
```typescript
// Partial fix, but blocked by RLS policy
if (userRole === 'operator') {
  query = query.eq('user_id', user.id);
}
// Engineers/admins try to see all, but RLS says NO
```

---

## Solution Implemented

### 1. **Updated RLS Policies** ✅

Created migration: `src/migrations/004_fix_data_sharing_rls.sql`

**Changes for concrete_plants:**
- ❌ Removed: `"Users can view own concrete plants"` (restrictive policy)
- ✅ Added: `"Users can view concrete plants by role"` (role-aware policy)
- ✅ Added: `"Users can update concrete plants by role"` (role-aware policy)
- ✅ Added: `"Users can delete concrete plants by role"` (role-aware policy)

**Changes for inventory_materials:**
- ❌ Removed: `"Users can view own inventory materials"` (restrictive policy)
- ✅ Added: `"Users can view inventory materials by role"` (role-aware policy)
- ✅ Added: `"Users can update inventory materials by role"` (role-aware policy)
- ✅ Added: `"Users can delete inventory materials by role"` (role-aware policy)

**New Policy Formula:**
```sql
-- Allow operators to see only their own, engineers/admins see all
USING (
  auth.uid() = user_id
  OR EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('engineer', 'admin')
  )
);
```

### 2. **Updated useConcretePlants Hook** ✅

**File:** `src/lib/hooks/useConcretePlants.ts`

**Changes:**
- ✅ Added `userRole` parameter to hook configuration
- ✅ Conditional filtering: operators filter by user_id, engineers/admins get all
- ✅ Updated real-time subscriptions to be role-aware
- ✅ Updated UPDATE/DELETE operations to respect roles

**Before:**
```typescript
const { plants } = useConcretePlants();  // No role info
```

**After:**
```typescript
const { plants } = useConcretePlants({ userRole: 'engineer' });  // Role-aware
```

### 3. **Updated Components** ✅

**Files Modified:**
- `src/components/inventory/InventoryPanel.tsx`
- `src/components/production/ProductionOrderForm.tsx`

**Changes:**
- ✅ Integrated `useAuth()` to get user role from profile
- ✅ Pass user role to both `useConcretePlants()` and `useInventoryMaterials()`
- ✅ Components now dynamically show data based on user role

---

## Access Control Matrix

| Data | Operators | Engineers | Admins |
|------|-----------|-----------|--------|
| Own Plants | ✅ See | ❌ | ❌ |
| All Plants | ❌ | ✅ See/Edit/Delete | ✅ See/Edit/Delete |
| Own Materials | ✅ See | ❌ | ❌ |
| All Materials | ❌ | ✅ See/Edit/Delete | ✅ See/Edit/Delete |

---

## How to Deploy

### Step 1: Apply RLS Policy Migration

1. Open **Supabase Dashboard** → **SQL Editor**
2. Copy entire content of `src/migrations/004_fix_data_sharing_rls.sql`
3. Paste into SQL Editor
4. **Execute**

**Verify Success:**
```sql
-- Check concrete_plants policies (should see 4 policies)
SELECT tablename, COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'concrete_plants'
GROUP BY tablename;

-- Check inventory_materials policies (should see 4 policies)
SELECT tablename, COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'inventory_materials'
GROUP BY tablename;
```

### Step 2: Deploy Code Changes

```bash
# All code changes are in src/
# Build and test locally first
npm run build
npm run test

# Then deploy to Vercel
git add .
git commit -m "Fix data sharing for plants and materials - enable role-based access"
git push
```

---

## Testing Checklist

### Test with Operator Account
- [ ] Can view only own concrete plants
- [ ] Can see only own inventory materials
- [ ] Cannot see other operators' plants/materials

### Test with Engineer Account
- [ ] Can see ALL concrete plants
- [ ] Can see ALL inventory materials
- [ ] Can edit and delete any plant/material
- [ ] Real-time updates show all records

### Test with Admin Account
- [ ] Can see ALL concrete plants
- [ ] Can see ALL inventory materials
- [ ] Can edit and delete any plant/material
- [ ] Real-time updates show all records

### Test Cross-Account Sharing
1. Create Plant as Operator A
2. Login as Engineer B
3. **Verify:** Engineer B can see Plant from Operator A ✅
4. Create Material as Operator A
5. Login as Admin C
6. **Verify:** Admin C can see Material from Operator A ✅

---

## Technical Details

### RLS Policy Logic

The new policies use **boolean logic** to allow access:

```
CAN ACCESS IF:
  (You own the record)
  OR
  (You are an engineer OR admin)
```

### Database Changes Summary

| Table | Records Affected | Change |
|-------|-----------------|--------|
| `concrete_plants` | All | RLS policies updated for role-based access |
| `inventory_materials` | All | RLS policies updated for role-based access |
| `profiles` | Queried | Used to check user roles in RLS policies |
| `auth.users` | Queried | Used to get authenticated user ID |

### No Data Migration Needed

- ✅ No records deleted or modified
- ✅ No schema changes
- ✅ No data migration required
- ✅ Backward compatible (only adds access, doesn't remove existing access)

---

## Files Modified

### Code Changes
```
src/lib/hooks/useConcretePlants.ts           (Updated hook logic)
src/components/inventory/InventoryPanel.tsx  (Added role handling)
src/components/production/ProductionOrderForm.tsx (Added role handling)
```

### Database Changes
```
src/migrations/004_fix_data_sharing_rls.sql  (New migration)
```

### Documentation
```
DATA_SHARING_FIX_SUMMARY.md                 (This file)
```

---

## Rollback Plan (if needed)

If you need to revert to the old restrictive policies:

```sql
-- Restore old restrictive policies
DROP POLICY IF EXISTS "Users can view concrete plants by role" ON concrete_plants;
DROP POLICY IF EXISTS "Users can update concrete plants by role" ON concrete_plants;
DROP POLICY IF EXISTS "Users can delete concrete plants by role" ON concrete_plants;

-- Recreate old policies (from 001_rls_policies_backup.sql)
CREATE POLICY "Users can view own concrete plants"
ON concrete_plants FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update own concrete plants"
ON concrete_plants FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own concrete plants"
ON concrete_plants FOR DELETE
USING (auth.uid() = user_id);

-- Repeat for inventory_materials...
```

---

## Verification Queries

Run these in Supabase SQL Editor to confirm everything is working:

```sql
-- 1. List all current policies
SELECT schemaname, tablename, policyname, qual
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('concrete_plants', 'inventory_materials')
ORDER BY tablename, policyname;

-- 2. Count policies per table
SELECT tablename, COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('concrete_plants', 'inventory_materials')
GROUP BY tablename;
-- Expected: concrete_plants=4, inventory_materials=4

-- 3. Verify RLS is enabled on both tables
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('concrete_plants', 'inventory_materials');
-- Expected: rowsecurity = 't' (true) for both
```

---

## Related Files

- `SUPABASE_SCHEMA.sql` - Original schema (for reference)
- `src/migrations/001_rls_policies_backup.sql` - Original RLS policies
- `src/migrations/003_audit_logs.sql` - Audit logging setup
- `RLS_VERIFICATION_REPORT.md` - Previous RLS verification results

---

## Summary

✅ **Issue:** Operators' plants and materials not visible to engineers/admins
✅ **Cause:** Overly restrictive RLS policies using only user-id matching
✅ **Solution:** Implemented role-based RLS policies + updated hooks
✅ **Result:** Engineers and admins now see all data; operators see only theirs
✅ **Testing:** Build passing, no TypeScript errors
✅ **Deployment:** Ready for production (migration file + code)

