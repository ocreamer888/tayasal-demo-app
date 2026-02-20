# Data Sharing Fix - Implementation Checklist

**Issue:** Production plants and materials not being reflected/shared across accounts
**Status:** ✅ IMPLEMENTED & READY FOR DEPLOYMENT
**Build Status:** ✅ PASSING (No TypeScript errors, no linting errors)

---

## What Was Done (Completed ✅)

### Analysis & Documentation
- [x] Identified root cause: Restrictive RLS policies + client-side implementation issues
- [x] Created detailed technical analysis document
- [x] Documented proper RLS pattern for role-based access

### Database Migration
- [x] Created migration file: `src/migrations/004_fix_data_sharing_rls.sql`
- [x] Migration updates RLS policies for:
  - [x] `concrete_plants` table
  - [x] `inventory_materials` table
- [x] Both now use role-based access (engineers/admins see all, operators see own)

### Code Changes
- [x] Updated `src/lib/hooks/useConcretePlants.ts`:
  - [x] Added `userRole` parameter
  - [x] Implemented role-aware data fetching
  - [x] Updated real-time subscriptions
  - [x] Updated UPDATE/DELETE operations
- [x] Updated `src/components/inventory/InventoryPanel.tsx`:
  - [x] Integrated `useAuth()` for role detection
  - [x] Pass role to `useConcretePlants` hook
- [x] Updated `src/components/production/ProductionOrderForm.tsx`:
  - [x] Integrated `useAuth()` for role detection
  - [x] Pass role to `useConcretePlants` hook

### Testing & Verification
- [x] Build passes: `npm run build` ✅
- [x] No TypeScript errors
- [x] No ESLint errors
- [x] Code compiles successfully

### Documentation
- [x] Created `DATA_SHARING_FIX_SUMMARY.md` (comprehensive overview)
- [x] Created `DEPLOY_DATA_SHARING_FIX.md` (deployment guide)
- [x] Created `memory/rls-policies.md` (technical reference)
- [x] Updated `memory/MEMORY.md` with fix details

---

## What You Need To Do (Before Deploy)

### Pre-Deployment (Optional but Recommended)
- [ ] Review the changes:
  ```bash
  git diff HEAD~0  # See what changed
  ```
- [ ] Read `DATA_SHARING_FIX_SUMMARY.md` for full context
- [ ] Understand the RLS policy changes in `src/migrations/004_fix_data_sharing_rls.sql`

### Deployment Steps (In Order)

#### 1️⃣ Apply Database Migration (Supabase Dashboard)
**Time:** ~2-3 minutes

```
Location: Supabase Console → SQL Editor
File: src/migrations/004_fix_data_sharing_rls.sql
Action: Copy & paste entire file, then click "Run"
```

**Verification Queries** (run in SQL Editor):
```sql
-- Check concrete_plants has 4 policies
SELECT COUNT(*) FROM pg_policies
WHERE tablename = 'concrete_plants' AND schemaname = 'public';
-- Expected: 4

-- Check inventory_materials has 4 policies
SELECT COUNT(*) FROM pg_policies
WHERE tablename = 'inventory_materials' AND schemaname = 'public';
-- Expected: 4
```

#### 2️⃣ Commit Code Changes
**Time:** ~1-2 minutes

```bash
cd /Users/macm1air/Documents/Code/tayasal-demo-app

# Verify clean working directory
git status

# Create commit
git add .
git commit -m "feat: Enable role-based data sharing for plants and materials

- Update RLS policies for concrete_plants and inventory_materials
- Implement role-aware access control (operators see own, engineers/admins see all)
- Refactor useConcretePlants hook to support role-based filtering
- Update InventoryPanel and ProductionOrderForm components

Fixes: Operarios' plants and materials not visible to engineers/admins
See: DATA_SHARING_FIX_SUMMARY.md for technical details"

# Verify commit looks good
git log -1

# Push to GitHub
git push origin main
```

#### 3️⃣ Deploy to Vercel
**Time:** ~2-5 minutes (automatic)

Option A (Recommended):
- Push to main (done above) → Vercel auto-deploys

Option B (Manual):
- Go to vercel.com → Select your project → Deployments
- Should see new deployment starting automatically

#### 4️⃣ Test in Production
**Time:** ~5-10 minutes

Test Accounts Needed (create if don't exist):
- 1x Operator account
- 1x Engineer account
- 1x Admin account

**Operator Test:**
```
1. Login as Operator A
2. Go to Inventory → Plantas
3. ✅ Verify: See only YOUR plants
4. Go to Inventory → Materiales
5. ✅ Verify: See only YOUR materials
6. Logout
```

**Engineer Test:**
```
1. Login as Engineer B
2. Go to Inventory → Plantas
3. ✅ Verify: See ALL plants (including Operator A's)
4. Go to Inventory → Materiales
5. ✅ Verify: See ALL materials (including Operator A's)
6. Try editing a plant created by Operator A
7. ✅ Verify: Can successfully edit it
8. Logout
```

**Admin Test:**
```
1. Login as Admin C
2. Go to Inventory → Plantas
3. ✅ Verify: See ALL plants (from all operators)
4. Go to Inventory → Materiales
5. ✅ Verify: See ALL materials (from all operators)
6. Logout
```

---

## Files Changed

### Database Migrations
```
src/migrations/004_fix_data_sharing_rls.sql (NEW)
└─ Drops old restrictive RLS policies
└─ Creates new role-based RLS policies
└─ Affects: concrete_plants, inventory_materials tables
```

### Code Files
```
src/lib/hooks/useConcretePlants.ts (MODIFIED)
├─ Added UserRole parameter
├─ Updated fetch logic for role-aware queries
├─ Updated real-time subscriptions
└─ Updated UPDATE/DELETE operations

src/components/inventory/InventoryPanel.tsx (MODIFIED)
├─ Added useAuth() integration
└─ Pass userRole to useConcretePlants hook

src/components/production/ProductionOrderForm.tsx (MODIFIED)
├─ Added useAuth() integration
└─ Pass userRole to useConcretePlants hook
```

### Documentation (NEW)
```
DATA_SHARING_FIX_SUMMARY.md
DEPLOY_DATA_SHARING_FIX.md
DATA_SHARING_IMPLEMENTATION_CHECKLIST.md (this file)
memory/rls-policies.md (technical reference)
```

---

## Success Criteria

After deployment, verify these conditions are met:

| Criterion | Status |
|-----------|--------|
| Database migration applied without errors | [ ] |
| RLS policies exist and are correct | [ ] |
| Code deployed to Vercel successfully | [ ] |
| Operator sees only own plants | [ ] |
| Operator sees only own materials | [ ] |
| Engineer sees all plants | [ ] |
| Engineer sees all materials | [ ] |
| Engineer can edit any plant | [ ] |
| Engineer can edit any material | [ ] |
| Admin sees all plants | [ ] |
| Admin sees all materials | [ ] |
| Real-time updates work for shared data | [ ] |

---

## Rollback Plan (If Needed)

### 📋 Database Rollback
```sql
-- Run in Supabase SQL Editor if you need to revert
-- This restores the old (restrictive) policies

-- Drop new policies for concrete_plants
DROP POLICY IF EXISTS "Users can view concrete plants by role" ON concrete_plants;
DROP POLICY IF EXISTS "Users can update concrete plants by role" ON concrete_plants;
DROP POLICY IF EXISTS "Users can delete concrete plants by role" ON concrete_plants;

-- Restore old policies
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
-- (See src/migrations/001_rls_policies_backup.sql for full restore)
```

### 📋 Code Rollback
```bash
# Revert the commit on GitHub
git revert HEAD
git push origin main

# Or reset to previous commit
git reset --hard HEAD~1
git push origin main --force-with-lease  # ⚠️ Use with caution
```

---

## Support & Troubleshooting

### ❌ "No plants showing for engineer"
**Check:**
1. Database migration was applied (run verification queries)
2. User has `role = 'engineer'` in profiles table
3. Browser cache cleared (reload page)
4. Check browser console for errors

### ❌ "Migration failed to apply"
**Check:**
1. Syntax errors in SQL file
2. You have permission to modify RLS policies
3. Tables exist (`concrete_plants`, `inventory_materials`)
4. Copy the entire file (don't edit, don't skip lines)

### ❌ "Deployment failed on Vercel"
**Check:**
1. Run `npm run build` locally (should pass)
2. Check Vercel deployment logs for specific error
3. If TypeScript error, run `npm run type-check`
4. Push a fix commit and Vercel will auto-retry

---

## Timeline

| Step | Time | Status |
|------|------|--------|
| Code implementation | 30 min | ✅ Done |
| Database migration creation | 15 min | ✅ Done |
| Documentation | 45 min | ✅ Done |
| **Database migration (Supabase)** | 3 min | ⏳ TODO |
| **Code commit & push** | 2 min | ⏳ TODO |
| **Vercel deployment** | 3-5 min | ⏳ TODO |
| **Testing in production** | 10 min | ⏳ TODO |
| **TOTAL** | ~20-25 min | |

---

## Next Steps

### ✅ Ready to Deploy?

1. **Review this checklist** - make sure you understand each step
2. **Go to next section** → "Deployment Steps (In Order)"
3. **Follow each step carefully** - they're in the correct order
4. **Test after deployment** - use the "Test in Production" section

### 📚 For Reference

- **Full technical details:** `DATA_SHARING_FIX_SUMMARY.md`
- **Step-by-step deploy guide:** `DEPLOY_DATA_SHARING_FIX.md`
- **RLS policy explanation:** `memory/rls-policies.md`
- **Migration file:** `src/migrations/004_fix_data_sharing_rls.sql`

---

## Questions?

If you hit any issues:

1. **Check the error message carefully** - often describes the problem
2. **Look at verification queries** - they show current state
3. **Review `memory/rls-policies.md`** - explains how RLS works
4. **Check Supabase dashboard** - SQL Editor → Recent Queries tab shows errors
5. **Check Vercel logs** - Deployments tab → Click deployment → Logs

---

**Status:** ✅ Implementation Complete - Ready for Deployment
**Last Updated:** February 20, 2026
**Prepared by:** Claude Code

