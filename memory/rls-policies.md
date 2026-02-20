# RLS Policies - Technical Reference

**Last Updated:** February 20, 2026
**Scope:** Row-Level Security implementation for role-based data access

---

## Overview

This document explains how RLS (Row-Level Security) policies control data access in the app. RLS is a **database-level** security feature that filters rows based on the authenticated user and their role.

---

## RLS Policy Pattern

### Pattern 1: User-Only (Deprecated)
Used for personal data that shouldn't be shared between users.

```sql
CREATE POLICY "Users can view own records"
ON table_name FOR SELECT
USING (auth.uid() = user_id);
```

**Access:** User can only see rows where `user_id` = their authenticated user ID

**Tables:** `profiles`, `team_members`, `equipments` (reason: personal team/equipment)

---

### Pattern 2: Role-Based (Current Best Practice)
Used for shared business data where engineers/admins need visibility across all operarios' records.

```sql
CREATE POLICY "Users can view records by role"
ON table_name FOR SELECT
USING (
  auth.uid() = user_id
  OR EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('engineer', 'admin')
  )
);
```

**Access Logic:**
1. Check if authenticated user owns the record: `auth.uid() = user_id` → ✅ Allow
2. OR check if user is engineer/admin → ✅ Allow
3. Otherwise → ❌ Deny

**Tables:** `production_orders`, `concrete_plants`, `inventory_materials`

**Why this pattern:**
- Operarios work independently with their own data
- Engineers/admins monitor and manage ALL operarios' data
- Maintains privacy while enabling oversight

---

## Current Policy Configuration

### concrete_plants

**Purpose:** Production facility information that all operarios use

**Policies:**
```sql
-- SELECT: Operarios see own, engineers/admins see all
CREATE POLICY "Users can view concrete plants by role"
ON concrete_plants FOR SELECT
USING (
  auth.uid() = user_id
  OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('engineer', 'admin'))
);

-- INSERT: Users can only create their own
CREATE POLICY "Users can insert own concrete plants"
ON concrete_plants FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- UPDATE: Operarios can update own, engineers/admins can update all
CREATE POLICY "Users can update concrete plants by role"
ON concrete_plants FOR UPDATE
USING (
  auth.uid() = user_id
  OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('engineer', 'admin'))
);

-- DELETE: Operarios can delete own, engineers/admins can delete all
CREATE POLICY "Users can delete concrete plants by role"
ON concrete_plants FOR DELETE
USING (
  auth.uid() = user_id
  OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('engineer', 'admin'))
);
```

**Access Matrix:**
| Operation | Operator | Engineer | Admin |
|-----------|----------|----------|-------|
| View own | ✅ | ✅ | ✅ |
| View others | ❌ | ✅ | ✅ |
| Insert own | ✅ | ✅ | ✅ |
| Insert others | ❌ | ❌ | ❌ |
| Update own | ✅ | ✅ | ✅ |
| Update others | ❌ | ✅ | ✅ |
| Delete own | ✅ | ✅ | ✅ |
| Delete others | ❌ | ✅ | ✅ |

---

### inventory_materials

**Purpose:** Shared material inventory that engineers monitor across operarios

**Policies:**
Same as `concrete_plants` (role-based access for SELECT/UPDATE/DELETE, user-only for INSERT)

---

### production_orders

**Purpose:** Production records that engineers/admins need to review and approve

**Policies:**
Same as `concrete_plants` and `inventory_materials` (already implemented correctly)

---

## How RLS Policies Work with Supabase Client

### Client-Side Query Example

```typescript
// Engineer fetching all plants
const { data } = await supabase
  .from('concrete_plants')
  .select('*');
```

**What happens:**
1. Client sends query to Supabase API
2. Supabase checks authenticated user ID and role
3. RLS policies are evaluated:
   - Is `auth.uid()` = any `user_id` in the table? → Include those rows
   - Is user an engineer/admin? → Include ALL rows
4. Supabase returns filtered results

---

## Common Mistakes & How to Avoid Them

### ❌ Mistake 1: Forgetting to Enable RLS

```sql
-- WRONG: Table created but RLS not enabled
CREATE TABLE products (
  id uuid PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id),
  name text
);

-- CORRECT: Enable RLS before creating policies
CREATE TABLE products (
  id uuid PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id),
  name text
);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own products"
ON products FOR SELECT
USING (auth.uid() = user_id);
```

**Verification:**
```sql
SELECT tablename, rowsecurity
FROM pg_tables
WHERE tablename = 'products';
-- rowsecurity should be 't' (true)
```

---

### ❌ Mistake 2: RLS Policy References Non-Existent Table

```sql
-- WRONG: Trying to check role but profiles table doesn't exist yet
CREATE POLICY "Check role"
ON orders FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);
```

**Fix:** Ensure referenced table exists and has the required columns

---

### ❌ Mistake 3: Client-Side Filtering Can't Override RLS

```typescript
// This won't work if RLS denies access!
const { data } = await supabase
  .from('concrete_plants')
  .select('*')
  .eq('user_id', specificUserId);  // This filter still respects RLS
```

**Explanation:** RLS is enforced at the database level, AFTER client-side filters. If RLS denies access to rows, the `.eq()` filter won't bypass it.

**Solution:** Update RLS policies if engineers/admins need access

---

## RLS Performance Considerations

### Index Optimization

For tables with RLS policies that filter by `user_id`, ensure you have an index:

```sql
-- Already created in schema:
CREATE INDEX idx_concrete_plants_user_id ON concrete_plants(user_id);
CREATE INDEX idx_inventory_materials_user_id ON inventory_materials(user_id);
```

### Policy Complexity

The role-check subquery in our policies is efficient because:
1. `profiles.id` is indexed (primary key)
2. Simple equality check (`user_id = ...`)
3. Small `IN` list (2 values: engineer, admin)

**Benchmarks** (typical):
- User owns record: ~1ms (direct index lookup)
- User is engineer: ~2-3ms (additional profiles lookup)
- Total latency: Still sub-50ms for most queries

---

## Testing RLS Policies

### Test as Different Roles

**Setup:**
1. Create 3 test users: operator_user, engineer_user, admin_user
2. Assign roles via `profiles` table
3. Create test data as operator_user

**Test Cases:**

```sql
-- As operator_user
SELECT COUNT(*) FROM concrete_plants;
-- Expected: Only operator_user's plants

-- Switch to engineer_user context
-- (In real testing, login as different user)
SELECT COUNT(*) FROM concrete_plants;
-- Expected: ALL plants (including operator's)
```

---

### Manual Testing Script

```sql
-- 1. Check which policies exist
SELECT schemaname, tablename, policyname
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('concrete_plants', 'inventory_materials')
ORDER BY tablename, policyname;

-- 2. View full policy definitions
SELECT schemaname, tablename, policyname, qual, permissive, cmd
FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'concrete_plants';

-- 3. Test real user access (requires being logged in as that user)
-- Login as engineer, run:
SELECT COUNT(*) FROM concrete_plants;  -- Should see all
SELECT COUNT(*) FROM concrete_plants WHERE user_id = 'OPERATOR_UUID';  -- Should see specific

-- 4. Check for policy conflicts
SELECT tablename, COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename
HAVING COUNT(*) > 4;  -- More than expected (4 CRUD operations)
```

---

## Updating RLS Policies

### Safe Update Process

1. **Document current policies:**
   ```sql
   SELECT policyname, qual
   FROM pg_policies
   WHERE schemaname = 'public' AND tablename = 'target_table';
   ```

2. **Drop old policy:**
   ```sql
   DROP POLICY IF EXISTS "Old policy name" ON target_table;
   ```

3. **Create new policy:**
   ```sql
   CREATE POLICY "New policy name"
   ON target_table FOR SELECT
   USING (...);
   ```

4. **Test immediately in same transaction** (or separately with test users)

5. **Document change** in commit message

---

## Debugging RLS Issues

### "No rows returned" Symptoms

**Common Causes:**
1. ❌ RLS policy is too restrictive
2. ❌ Table doesn't have RLS enabled
3. ❌ User's role isn't in the policy's allowed list
4. ❌ `user_id` column doesn't match authenticated user ID

**Debug Steps:**
```sql
-- 1. Verify RLS is enabled
SELECT rowsecurity FROM pg_tables WHERE tablename = 'concrete_plants';

-- 2. Check policies exist
SELECT policyname FROM pg_policies WHERE tablename = 'concrete_plants';

-- 3. Verify policies (run as the specific user)
SELECT * FROM concrete_plants;  -- Should return rows

-- 4. Check if authenticated user's profile exists
SELECT * FROM profiles WHERE id = auth.uid();  -- Should return a row with role
```

---

## Policy Modification Checklist

When adding a new table that needs role-based access:

- [ ] Create table with `user_id uuid` column
- [ ] Run `ALTER TABLE ... ENABLE ROW LEVEL SECURITY;`
- [ ] Create INSERT policy (user can only insert their own)
- [ ] Create SELECT policy (use role-based pattern if needed)
- [ ] Create UPDATE policy (use role-based pattern if needed)
- [ ] Create DELETE policy (use role-based pattern if needed)
- [ ] Create index: `CREATE INDEX idx_table_user_id ON table_name(user_id);`
- [ ] Test with operator, engineer, and admin users
- [ ] Document in this file
- [ ] Add migration file to `src/migrations/`

---

## Related Documentation

- `DATA_SHARING_FIX_SUMMARY.md` - Feb 20 fix details
- `SUPABASE_SCHEMA.sql` - Full schema definition
- `src/migrations/001_rls_policies_backup.sql` - Original RLS policies
- `src/migrations/004_fix_data_sharing_rls.sql` - Latest RLS update

---

## Supabase Resources

- [RLS Guide](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Auth Users Context](https://supabase.com/docs/guides/auth#auth-context)
- [Policy Examples](https://supabase.com/docs/guides/database/postgres/row-level-security/concepts)

