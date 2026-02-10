# RLS Verification Checklist

**Date:** ___02/10/2026________
**Verified by:** __Marco_________

---

## Instructions

1. Go to **Supabase Dashboard** → Your Project → **Database** → **Policies**
2. You'll see a table of all policies. Verify each one below.
3. Check ✅ if policy exists and matches expected definition
4. Note any deviations in "Comments" column
5. Take screenshots of the Policies page (full page)
6. Save screenshots to `docs/supabase-rls-policies-screenshots/`
7. After verification, update `RLS_VERIFICATION_REPORT.md` with findings
8. Mark Task #3 complete if all policies verified ✅

---

## Policies to Verify

### Table: `profiles`

| Policy Name | Expected Definition | Verified | Comments |
|-------------|---------------------|----------|----------|
| Users can view own profile | SELECT where `auth.uid() = id` | ✅ | |
| Users can update own profile | UPDATE where `auth.uid() = id` | ✅ | |
| Users can insert own profile | INSERT with `auth.uid() = id` | ✅ | |

**RLS Enabled?** ✅ Yes ☐ No
**Total policies expected:** 3

---

### Table: `concrete_plants`

| Policy Name | Expected Definition | Verified | Comments |
|-------------|---------------------|----------|----------|
| Users can view own concrete plants | SELECT where `auth.uid() = user_id` | ✅ | |
| Users can insert own concrete plants | INSERT with `auth.uid() = user_id` | ✅ | |
| Users can update own concrete plants | UPDATE where `auth.uid() = user_id` | ✅ | |
| Users can delete own concrete plants | DELETE where `auth.uid() = user_id` | ✅ | |

**RLS Enabled?** ✅ Yes ☐ No
**Total policies expected:** 4

---

### Table: `equipments`

| Policy Name | Expected Definition | Verified | Comments |
|-------------|---------------------|----------|----------|
| Users can view own equipments | SELECT where `auth.uid() = user_id` | ✅ | |
| Users can insert own equipments | INSERT with `auth.uid() = user_id` | ✅ | |
| Users can update own equipments | UPDATE where `auth.uid() = user_id` | ✅ | |
| Users can delete own equipments | DELETE where `auth.uid() = user_id` | ✅ | |

**RLS Enabled?** ✅ Yes ☐ No
**Total policies expected:** 4

---

### Table: `team_members`

| Policy Name | Expected Definition | Verified | Comments |
|-------------|---------------------|----------|----------|
| Users can view own team members | SELECT where `auth.uid() = user_id` | ✅ | |
| Users can insert own team members | INSERT with `auth.uid() = user_id` | ✅ | |
| Users can update own team members | UPDATE where `auth.uid() = user_id` | ✅ | |
| Users can delete own team members | DELETE where `auth.uid() = user_id` | ✅ | |

**RLS Enabled?** ✅ Yes ☐ No
**Total policies expected:** 4

---

### Table: `inventory_materials`

| Policy Name | Expected Definition | Verified | Comments |
|-------------|---------------------|----------|----------|
| Users can view own inventory materials | SELECT where `auth.uid() = user_id` | ✅ | |
| Users can insert own inventory materials | INSERT with `auth.uid() = user_id` | ✅ | |
| Users can update own inventory materials | UPDATE where `auth.uid() = user_id` | ✅ | |
| Users can delete own inventory materials | DELETE where `auth.uid() = user_id` | ✅ | |

**RLS Enabled?** ✅ Yes ☐ No
**Total policies expected:** 4

---

### Table: `production_orders` (CRITICAL - Role-based)

| Policy Name | Expected Definition | Verified | Comments |
|-------------|---------------------|----------|----------|
| Operators can view own production orders | SELECT where `user_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('engineer','admin'))` | ✅ |   ((auth.uid() = user_id) OR (EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['engineer'::text, 'admin'::text])))))) |
| Users can insert own production orders | INSERT with `auth.uid() = user_id` | ✅ | alter policy "Users can insert own production orders"
on "public"."production_orders"
to public
with check (
  (auth.uid() = user_id)|
| Users can update own production orders | UPDATE with same OR EXISTS clause as SELECT | ✅ |  ((auth.uid() = user_id) OR (EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['engineer'::text, 'admin'::text]))))))|
| Users can delete own production orders | DELETE with same OR EXISTS clause as SELECT | ✅ |   ((auth.uid() = user_id) OR (EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['engineer'::text, 'admin'::text])))))) |

**RLS Enabled?** ✅ Yes ☐ No
**Total policies expected:** 4
**Note:** These policies MUST include the role-based access for engineers/admins to see all orders.

---

## Additional Tables (Verify if Exist)

The task mentions 8 tables. Check if these exist in your database:

| Table Name | Exists? | RLS Enabled? | Policies Applied? | Comments |
|------------|---------|--------------|-------------------|----------|
| shift_assignments | no | ☐ | ☐ | Not in SUPABASE_SCHEMA.sql - may be planned future feature |
| order_materials | no | ☐ | ☐ | Not in SUPABASE_SCHEMA.sql - may be planned future feature |
| material_requirements | no | ☐ | ☐ | Not in SUPABASE_SCHEMA.sql - may be planned future feature |

**Note:** Only 6 tables are defined in `SUPABASE_SCHEMA.sql`. If these 3 additional tables exist, they may have been created separately. If they exist, they MUST have RLS policies. If they don't exist, that's okay - the schema covers all current tables.

---

## Summary Check

- [ ] All 6 main tables have RLS ENABLED
- [ ] All 23 policies exist (3 for profiles + 4×5 for other tables = 23 total)
- [ ] `production_orders` policies include engineer/admin role escalation
- [ ] No policies are missing or misnamed
- [ ] Screenshots taken and saved
- [ ] Findings documented in `RLS_VERIFICATION_REPORT.md`

---

## If Issues Found

### Missing RLS on table:
```sql
ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;
```

### Missing policy:
```sql
CREATE POLICY "Policy name"
ON table_name FOR SELECT
USING (condition);
```

### Incorrect policy:
```sql
DROP POLICY IF EXISTS "Wrong policy name" ON table_name;
-- Then create correct one
```

After fixing, re-run verification.

---

## Functional Testing (Optional but Recommended)

1. **Create test users:**
   - Operator account
   - Engineer account

2. **Test operator isolation:**
   - Login as operator, create a production order
   - Login as different operator, verify they CANNOT see first operator's order
   - Can use Supabase SQL: `SELECT * FROM production_orders WHERE user_id = 'operator-1-uuid';`

3. **Test engineer access:**
   - Login as engineer, verify they CAN see ALL production orders

4. **Test inventory isolation:**
   - Operator A creates inventory entry
   - Operator B should NOT see it

5. **Test profiles:**
   - Users should only see their own profile via SELECT

---

## Completion

When all checks pass:
- [ ] Update `memory/active-tasks.md` to mark Task #3 complete
- [ ] Update `memory/SECURITY_FIRST_SUMMARY.md` to reflect RLS verification done
- [ ] Create follow-up task if any policies need fixing

---

## Reference Files

- `SUPABASE_SCHEMA.sql` (lines 249-286 for policy definitions)
- `RLS_VERIFICATION_REPORT.md` (detailed documentation)
- `src/migrations/001_rls_policies_backup.sql` (policy definitions as SQL)
- `rules/CYBERSECURITY_MASTERY.md` (lines 888-950 on RLS)
- `memory/role-separation-analysis.md` (role-based access analysis)

---

**Important:** RLS is the **foundation of data isolation**. Without correct RLS policies, operators can see all data, completely bypassing all UI-level role checks. This is a **launch blocker**.
