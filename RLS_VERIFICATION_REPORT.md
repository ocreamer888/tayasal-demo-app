# RLS Policies Verification Report

**Date:** 2026-02-09
**Task:** #3 - Verify and document RLS policies
**Schema Source:** `SUPABASE_SCHEMA.sql`

---

## Expected RLS Policies Matrix

Based on `SUPABASE_SCHEMA.sql` lines 249-286, the following RLS policies should exist:

### Table: `profiles`
- ✅ RLS ENABLED (line 22)
- Policy: `"Users can view own profile"` - SELECT using `auth.uid() = id`
- Policy: `"Users can update own profile"` - UPDATE using `auth.uid() = id`
- Policy: `"Users can insert own profile"` - INSERT with check `auth.uid() = id`
- **Note:** Engineers/admins should see all profiles? (Verify if this is sufficient)

### Table: `concrete_plants`
- ✅ RLS ENABLED (line 65)
- Policy: `"Users can view own concrete plants"` - SELECT `auth.uid() = user_id`
- Policy: `"Users can insert own concrete plants"` - INSERT with check `auth.uid() = user_id`
- Policy: `"Users can update own concrete plants"` - UPDATE `auth.uid() = user_id`
- Policy: `"Users can delete own concrete plants"` - DELETE `auth.uid() = user_id`

### Table: `equipments`
- ✅ RLS ENABLED (line 103)
- Same 4 policies as `concrete_plants` (lines 107-121)

### Table: `team_members`
- ✅ RLS ENABLED (line 138)
- Same 4 policies (lines 142-156)

### Table: `inventory_materials`
- ✅ RLS ENABLED (line 176)
- Same 4 policies (lines 182-196)

### Table: `production_orders`
- ✅ RLS ENABLED (line 240)
- **Special Role-Based Policies:**
  - SELECT (lines 251-260):
    ```sql
    USING (
      auth.uid() = user_id
      OR EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role IN ('engineer', 'admin')
      )
    )
    ```
    → Operators see own orders; Engineers/Admins see all orders
  - INSERT (line 262-264): `WITH CHECK (auth.uid() = user_id)`
  - UPDATE (lines 266-275): Same as SELECT (engineers can update any order)
  - DELETE (lines 277-286): Same as SELECT

---

## Verification Steps

### 1. Open Supabase Dashboard
- Navigate to **Database** → **Policies**
- You'll see a list of all policies for all tables

### 2. Verify RLS is ENABLED for Each Table
For each table, check:
- **Table** → Row policies → Should show "Enabled"

### 3. Document Each Policy
For each policy, verify:
- ✅ Policy name matches schema
- ✅ Command (SELECT/INSERT/UPDATE/DELETE) matches
- ✅ Using/Check expression matches schema
- ✅ Target roles: `authenticated` or as expected

### 4. Test Functionality
**Test 1 - Operator isolation:**
- Login as operator user
- Create a production order
- Verify via API/SQL that operator CANNOT query other users' orders

**Test 2 - Engineer access:**
- Login as engineer user
- Verify they can see ALL production orders (across users)

**Test 3 - Cost confidentiality:**
- Verify operator's queries don't include `total_cost` (should be filtered at query level, not just UI)
- Actually, all fields ARE accessible; cost confidentiality enforced via UI (Tasks #20-24)

**Test 4 - Inventory isolation:**
- Operator A creates inventory entry
- Operator B should NOT see it via direct query

---

## Documentation Template

```
## RLS Policies Verification

### Table: profiles
| Policy Name | Command | Condition | Status |
|-------------|---------|-----------|--------|
| Users can view own profile | SELECT | auth.uid() = id | ✅ Verified |
| Users can update own profile | UPDATE | auth.uid() = id | ✅ Verified |
| Users can insert own profile | INSERT | auth.uid() = id | ✅ Verified |

### Table: production_orders
| Policy Name | Command | Condition | Status |
|-------------|---------|-----------|--------|
| Operators can view own production orders | SELECT | auth.uid() = user_id OR EXISTS (...) | ✅ Verified |
| Users can insert own production orders | INSERT | auth.uid() = user_id | ✅ Verified |
| Users can update own production orders | UPDATE | Same as SELECT | ✅ Verified |
| Users can delete own production orders | DELETE | Same as SELECT | ✅ Verified |

[... repeat for all tables ...]

### Deviations from Schema
- [ ] List any policies that differ from `SUPABASE_SCHEMA.sql`
- [ ] Note any missing policies
- [ ] Note any extra policies
```

---

## Exporting Policy Definitions (Migration Backup)

Run this query in Supabase SQL Editor to export all policies as SQL:

```sql
SELECT
  'CREATE POLICY "' || policyname || '" ON ' || tablename || '
' ||
  'FOR ' || cmd || '
' ||
  'USING ' || qual || '
' ||
  'WITH CHECK ' || with_check || ';'
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

Copy the output and save as: `src/migrations/rls_policies_export_2026-02-09.sql`

---

## Common Issues to Check

1. **RLS NOT ENABLED**: Table exists but policies won't apply if RLS is disabled
2. **Missing policies**: Some tables might have only SELECT but not INSERT/UPDATE/DELETE
3. **Wrong condition**: Using `user_id = auth.uid()` instead of `auth.uid() = user_id` (functionally same but consistency matters)
4. **Profiles table visibility**: Current schema allows users to see only their own profile. But `useAuth()` context fetches profile on login - verify this works for engineer role too.
5. **Production orders engineer access**: The `EXISTS(SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('engineer', 'admin'))` clause is critical. Must verify it works.

---

## If Policies Are Missing or Broken

### To Create Missing Policy:
```sql
CREATE POLICY "Policy name here"
ON table_name FOR SELECT
USING (auth.uid() = user_id);
```

### To Drop Incorrect Policy:
```sql
DROP POLICY IF EXISTS "Policy name here" ON table_name;
```

### To Update Policy:
Drop and recreate with correct definition.

---

## Expected 8 Tables (from task #3)

According to task #3, verify these **8 tables**:
1. `profiles`
2. `production_orders`
3. `inventory_materials`
4. `concrete_plants`
5. `equipments`
6. `team_members`
7. `shift_assignments` (not in current schema - verify if exists)
8. `order_materials` (not in current schema - verify if exists)

**NOTE:** `SUPABASE_SCHEMA.sql` includes only 6 tables. Verify if `shift_assignments` and `order_materials` exist in database. If not, they may be planned features.

---

## After Verification

- [ ] Update this file with actual policy status (✅ or ❌)
- [ ] Take screenshots of Policies page in Supabase Dashboard
- [ ] Save screenshots to: `docs/supabase-rls-policies-screenshots/`
- [ ] If any issues found → fix immediately and re-verify
- [ ] Mark Task #3 complete in memory files

---

## Reference

- **Schema file:** `SUPABASE_SCHEMA.sql` (lines 249-286 for production_orders policies)
- **RLS concepts:** `rules/CYBERSECURITY_MASTERY.md` lines 888-950
- **Role separation:** `memory/role-separation-analysis.md`
- **Security summary:** `memory/SECURITY_FIRST_SUMMARY.md`
