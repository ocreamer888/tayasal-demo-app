# Deployment Guide - Data Sharing Fix

**Quick Reference:** How to deploy the data sharing fix (Feb 20, 2026)

---

## What Was Fixed

✅ **Problem:** Operarios' plants and materials not visible to engineers/admins
✅ **Cause:** Restrictive RLS policies preventing role-based access
✅ **Solution:** Implemented role-aware RLS policies + updated React hooks
✅ **Result:** Engineers/admins now see all data; operarios see only theirs

---

## Pre-Deployment Checklist

- [ ] Code changes are in `main` branch (git status is clean)
- [ ] Build passes locally: `npm run build` ✅
- [ ] TypeScript compilation passes: `npm run build` ✅
- [ ] No uncommitted changes in src files

---

## Deployment Steps

### Step 1: Apply Database Migration (Supabase)

**Time Required:** 2-3 minutes

1. Open **Supabase Dashboard** (your project)
2. Navigate to **SQL Editor**
3. Click **"New query"**
4. Copy & paste the entire content of:
   ```
   src/migrations/004_fix_data_sharing_rls.sql
   ```
5. Click **"Run"** button
6. Wait for success message (should see: "Query succeeded")

**Expected Output:**
```
DROP POLICY (takes a second)
CREATE POLICY (repeats multiple times)
```

### Step 2: Verify Database Changes (Supabase)

Run these verification queries one at a time:

**Query 1 - Check concrete_plants policies:**
```sql
SELECT schemaname, tablename, policyname
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'concrete_plants'
ORDER BY policyname;
```
**Expected:** 4 policies (SELECT, INSERT, UPDATE, DELETE)

**Query 2 - Check inventory_materials policies:**
```sql
SELECT schemaname, tablename, policyname
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'inventory_materials'
ORDER BY policyname;
```
**Expected:** 4 policies (SELECT, INSERT, UPDATE, DELETE)

**Query 3 - Verify RLS is enabled:**
```sql
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('concrete_plants', 'inventory_materials');
```
**Expected:** Both tables show `rowsecurity = true`

### Step 3: Deploy Code to Vercel

**Option A: Via Git (Recommended)**
```bash
cd /Users/macm1air/Documents/Code/tayasal-demo-app

# Verify clean state
git status

# Commit changes
git add .
git commit -m "feat: Enable role-based data sharing for plants and materials

- Update RLS policies for concrete_plants and inventory_materials
- Implement role-aware access control (operators see own, engineers/admins see all)
- Refactor useConcretePlants hook to support role-based filtering
- Update InventoryPanel and ProductionOrderForm components

Fixes: Operarios' data not visible to engineers/admins
See: DATA_SHARING_FIX_SUMMARY.md for details"

# Verify your commit message looks good
git log -1

# Push to GitHub (auto-deploys to Vercel)
git push origin main
```

**Option B: Via Vercel Dashboard**
1. Go to vercel.com
2. Select your project
3. It should auto-detect the new commits and deploy
4. Wait for deployment to complete

### Step 4: Test in Production

**Wait for Vercel deployment to complete** (takes 1-2 minutes)

#### Test with Operator Account
1. Login as **Operator (operario)**
2. Go to **Inventory** → **Plantas**
3. **Verify:** You see ONLY your own plants ✅
4. Go to **Inventory** → **Materiales**
5. **Verify:** You see ONLY your own materials ✅

#### Test with Engineer Account
1. Login as **Engineer**
2. Go to **Inventory** → **Plantas**
3. **Verify:** You see ALL plants (from all operators) ✅
4. Go to **Inventory** → **Materiales**
5. **Verify:** You see ALL materials (from all operators) ✅
6. Try to edit an operator's plant: **Verify:** You can edit it ✅

#### Test with Admin Account
1. Login as **Admin**
2. Go to **Inventory** → **Plantas**
3. **Verify:** You see ALL plants (from all operators) ✅
4. Go to **Inventory** → **Materiales**
5. **Verify:** You see ALL materials (from all operators) ✅

---

## Rollback Plan (if needed)

If something goes wrong, you can revert the database changes:

### Quick Rollback

1. Open Supabase SQL Editor
2. Copy & paste content from:
   ```
   src/migrations/001_rls_policies_backup.sql
   ```
3. Run the queries (restores original restrictive policies)
4. Everything reverts to operator-only access

### Code Rollback (if deployment is broken)

```bash
# Revert the deployment on Vercel or:
git revert HEAD
git push origin main
```

---

## What Changed

### Database (Supabase)
```
Migration: 004_fix_data_sharing_rls.sql
- Drops: 6 old restrictive policies
- Creates: 6 new role-based policies
- Tables affected: concrete_plants, inventory_materials
```

### Code (Next.js)
```
Files modified:
1. src/lib/hooks/useConcretePlants.ts
   - Added: userRole parameter
   - Updated: Fetch logic to be role-aware
   - Updated: Real-time subscriptions
   - Updated: UPDATE/DELETE operations

2. src/components/inventory/InventoryPanel.tsx
   - Added: useAuth() to get user role
   - Updated: Pass userRole to useConcretePlants hook

3. src/components/production/ProductionOrderForm.tsx
   - Added: useAuth() to get user role
   - Updated: Pass userRole to useConcretePlants hook
```

---

## Access Control After Fix

| Access Level | Concrete Plants | Inventory Materials | Production Orders |
|--------------|-----------------|---------------------|-------------------|
| **Operator** | Own only ✓ | Own only ✓ | Own only ✓ |
| **Engineer** | All ✓ | All ✓ | All ✓ |
| **Admin** | All ✓ | All ✓ | All ✓ |

---

## Support

If deployment fails:

1. **Check Vercel logs:** vercel.com → your project → Deployments
2. **Check Supabase logs:** Supabase dashboard → Project → Logs
3. **Verify RLS policies:** Run verification queries above
4. **Check client console:** Browser DevTools → Console tab for errors

**Documentation:**
- Full details: `DATA_SHARING_FIX_SUMMARY.md`
- Original schema: `SUPABASE_SCHEMA.sql`
- RLS backup: `src/migrations/001_rls_policies_backup.sql`

---

## Success Criteria

✅ Database migration applies without errors
✅ Build passes: `npm run build`
✅ Deployment succeeds on Vercel
✅ Engineers/admins can see all operarios' plants
✅ Engineers/admins can see all operarios' materials
✅ Operarios can ONLY see their own records
✅ Real-time updates work for shared records

---

**Deployment Time Estimate:** 15-20 minutes (mostly waiting for Vercel)

