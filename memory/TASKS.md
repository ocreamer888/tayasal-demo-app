# Project Task List - Complete Status & Priority

**Last Updated:** 2026-02-09
**Overall Completion:** 75% → targeting 100% after all tasks
**Critical Path:** Security hardening (Tier 1) before any testing/deployment

---

## 📊 Quick Overview

| Tier | Tasks | Hours | Status | Dependencies |
|------|-------|-------|--------|--------------|
| 🔴 Tier 1: Security | 16 | 30-40 | ❌ All pending | None (blocking) |
| 🟡 Tier 2: Core Fixes | 10 | 12-15 | ❌ All pending | Can parallel with Tier 1 |
| 🟢 Tier 3: Features/QA | 4 | 16-24 | ❌ All pending | Tier 1 recommended |
| 🔵 Tier 4: Finalization | 1 | 2-4 | ❌ Pending | Tier 3 complete |
| **Total** | **31** | **60-83h** | | |

---

## 🔴 TIER 1: SECURITY HARDENING (BLOCKERS)

**Must complete BEFORE any testing, staging deployment, or beta launch.**

### Category A: Cost Confidentiality (Business Critical)

#### Task #20: Hide Cost Column in Orders List
- **File:** `src/components/production/ProductionOrderList.tsx`
- **Lines:** 208-210
- **Effort:** 15 minutes
- **Description:** Wrap total_cost table cell in conditional: only render for `userRole === 'engineer' || userRole === 'admin'`. Operators see `-` or empty cell instead.
- **Acceptance:** Operators cannot see any cost figures in orders table
- **Dependencies:** None

#### Task #21: Hide Cost Breakdown in Order Details Modal
- **File:** `src/components/production/ProductionOrderDetails.tsx`
- **Lines:** 283-315 (entire "Desglose de Costos" card)
- **Effort:** 30 minutes
- **Description:** Wrap entire cost breakdown card in conditional. Only engineers/admins see materials, labor, equipment, energy, maintenance, total costs. Operators see no cost section.
- **Acceptance:** Modal for operator shows no cost data
- **Dependencies:** None

#### Task #22: Hide Cost KPI in Dashboard
- **File:** `src/components/dashboard/ProductionDashboard.tsx`
- **Lines:** 118-122 (MetricCard "Costo Promedio")
- **Effort:** 15 minutes
- **Description:** Remove or conditionally hide "Costo Promedio" MetricCard. Only render for engineer/admin roles.
- **Acceptance:** Operators do not see any cost metrics on dashboard
- **Dependencies:** None

#### Task #23: Hide Cost Column in Dashboard Recent Orders Table
- **File:** `src/components/dashboard/ProductionDashboard.tsx`
- **Lines:** 314 (table header "Costo" and column data)
- **Effort:** 15 minutes
- **Description:** Either remove cost column entirely from recent orders table, OR conditionally render based on userRole. Recommended: remove for all users (redundant with order details) or hide for operators.
- **Acceptance:** No cost data visible in recent orders table
- **Dependencies:** None

#### Task #24: Verify Dashboard Charts Data Isolation
- **File:** `src/components/dashboard/ProductionDashboard.tsx`
- **Lines:** 56-87 (chart data preparation), 171-250 (charts)
- **Effort:** 15 minutes
- **Description:** Verify that charts do NOT include cost data in tooltips or labels. The productionByMonth data includes 'costo' field (line 77) but chart only uses 'cantidad'. Ensure tooltip config doesn't expose cost. If needed, create role-based chart data.
- **Acceptance:** Chart tooltips show only production quantities, not costs, for operators
- **Dependencies:** Tasks #20-23

---

### Category B: Authentication Hardening (OWASP A04, A07)

#### Task #25: Implement Rate Limiting on Auth Endpoints
- **Files:** New file `src/lib/rate-limit.ts`, middleware or API route modifications
- **Effort:** 2 hours
- **Description:** Add rate limiting to `/api/auth/login` and `/api/auth/signup` (or Supabase auth callbacks if using Supabase Auth). Configuration: 5 attempts per 15 minutes for login, 3 attempts per hour for signup. Store counters in Redis (Upstash recommended) or in-memory Map for development.
- **Acceptance:**
  - After 5 failed login attempts within 15 minutes, further attempts blocked with error "Too many attempts, please try again later"
  - Rate limit headers returned (X-RateLimit-*)
  - Works across serverless functions (Redis shared store)
- **Dependencies:** None
- **Reference:** `rules/CYBERSECURITY_MASTERY.md` lines 546-592

#### Task #26: Implement Account Lockout Mechanism
- **Files:** New `src/lib/account-lockout.ts`, integrate with auth flow
- **Effort:** 2 hours
- **Description:** After 5 failed login attempts, lock account for 1 hour. Store failed attempt counters and lock status in Redis. Provide admin unlock capability (future). Integrate with existing auth to reject locked accounts before authentication.
- **Acceptance:**
  - Failed attempt counter increments per username/IP
  - Lockout after 5 failures, 1-hour duration
  - Locked accounts receive "Account locked. Try again later." message
  - Automatic unlock after 1 hour (or manual admin unlock later)
- **Dependencies:** Task #25 (can share Redis infrastructure)
- **Reference:** `rules/CYBERSECURITY_MASTERY.md` lines 594-651

#### Task #29: Add Password Strength Validation
- **File:** `src/app/signup/page.tsx`
- **Effort:** 1 hour
- **Description:** Install `zxcvbn` library and integrate password strength meter in signup form. Enforce minimum score of 3, length 12+, require uppercase, lowercase, numbers, special characters. Show real-time feedback with requirements checklist. Prevent submission if password weak.
- **Acceptance:**
  - Password field shows strength meter (weak/medium/strong)
  - Specific feedback: "Add uppercase", "Add 4 more characters", etc.
  - Form submission blocked if score < 3
- **Dependencies:** None
- **Reference:** `rules/CYBERSECURITY_MASTERY.md` lines 943-975

---

### Category C: Defense Headers & Configuration (OWASP A04, A05)

#### Task #27: Add Security Headers Middleware
- **File:** New `src/middleware.ts` (or update existing)
- **Effort:** 1 hour
- **Description:** Implement security headers using custom middleware or `next-security` package. Must include:
  - `X-Frame-Options: DENY` (prevent clickjacking)
  - `X-Content-Type-Options: nosniff` (prevent MIME sniffing)
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `Permissions-Policy: geolocation=(), microphone=(), camera=()`
  - `Content-Security-Policy: default-src 'self'` (start loose, tighten later)
  - `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload` (production only)
- **Acceptance:** All security headers present in HTTP responses (check DevTools Network tab)
- **Dependencies:** None (but will affect all pages)
- **Reference:** `rules/CYBERSECURITY_MASTERY.md` lines 716-784

#### Task #28: Add Environment Validation on Startup
- **File:** New `src/lib/env-validation.ts`, import in `src/app/layout.tsx` or root
- **Effort:** 30 minutes
- **Description:** Validate all required environment variables on app startup using Zod schema. Check: `NODE_ENV`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (if using), any custom secrets. Exit process (or show error screen) if validation fails.
- **Acceptance:** App fails fast with clear error message if required env vars missing or malformed
- **Dependencies:** None
- **Reference:** `rules/CYBERSECURITY_MASTERY.md` lines 810-829

#### Task #32: Sanitize Error Responses
- **Files:** All API routes (if any), error boundaries, global error handler
- **Effort:** 1 hour
- **Description:** Ensure no error responses to client include stack traces, internal paths, database details, or sensitive information. All errors should return generic message: "An error occurred" or "Internal server error". Log full error server-side only (console.error or dedicated logger).
- **Acceptance:**
  - Production errors: `{ error: "Internal server error" }` (no stack)
  - Development errors: can include details (check NODE_ENV)
  - All errors logged server-side with full context
- **Dependencies:** None
- **Reference:** `rules/CYBERSECURITY_MASTERY.md` lines 786-807

---

### Category D: Logging & Monitoring (OWASP A09)

#### Task #30: Implement Comprehensive Audit Logging
- **Files:** New `src/lib/audit.ts`, new database table `audit_logs`, integration throughout app
- **Effort:** 8 hours (largest security task)
- **Description:** Create audit logging system capturing all sensitive operations. Create `audit_logs` table with RLS. Implement `logAudit()` function. Instrument all critical paths:
  - Authentication: login success/failure, logout, password reset
  - Authorization: order approvals/rejections, inventory adjustments, role changes
  - Data access: export operations, bulk reads
  - Errors: failed authorization attempts
- **Acceptance:**
  - `audit_logs` table exists with columns: id, timestamp, userId, action, resourceType, resourceId, oldValue, newValue, ip, userAgent
  - All order approvals log entry with before/after state
  - All inventory adjustments log entry with delta
  - All auth events logged (success/failure)
  - Logs queryable for incident response
- **Dependencies:** Task #4 (migration to create table)
- **Reference:** `rules/CYBERSECURITY_MASTERY.md` lines 1253-1454

---

### Category E: Data Integrity & Infrastructure

#### Task #3: Verify and Document RLS Policies
- **Location:** Supabase Dashboard → Database → Policies
- **Effort:** 30 minutes
- **Description:** Log into Supabase Dashboard, verify RLS policies exist on all 8 tables (production_orders, inventory_materials, concrete_plants, equipments, team_members, profiles, auth.users). Confirm: operators filtered by `user_id = auth.uid()`, engineers have no filter (see all). Take screenshots and document policy names and definitions.
- **Acceptance:**
  - Screenshots of all RLS policies saved in `/docs/supabase-rls-policies.md` (or similar)
  - Written documentation of each policy: table, operation (SELECT/INSERT/UPDATE/DELETE), filter condition
  - Test confirmed: operator user can only see own rows
- **Dependencies:** None
- **Critical:** This is foundation of data isolation

#### Task #4: Create Database Migration Files
- **Location:** New directory `supabase/migrations/`
- **Effort:** 1 hour
- **Description:** Export current database schema from Supabase (pg_dump or Dashboard SQL export). Create versioned migration files (e.g., `20250209_initial_schema.sql`) including: table definitions, indexes, constraints, RLS policies, triggers, and seed data if any. Include both UP and DOWN migrations for reversibility.
- **Acceptance:**
  - Migration file(s) in `supabase/migrations/` with proper naming
  - File contains all DDL needed to recreate schema from scratch
  - Test migration in fresh Supabase project (optional but recommended)
- **Dependencies:** Task #3 (need to document policies)
- **Why:** Reproducibility, team onboarding, deployment to new environments

#### Task #7: Implement Atomic Order Approval Transaction
- **File:** `src/lib/hooks/useProductionOrders.ts`
- **Lines:** 359-389 (updateOrderStatus function)
- **Effort:** 2 hours
- **Description:** Refactor order approval to use atomic transaction. Currently: update order status, then loop to update inventory (separate operations). If inventory update fails after order status updated, data inconsistent. Solution: Create Supabase RPC function `approve_order_and_deduct_inventory(order_id, user_id)` that wraps both operations in a single transaction with proper error handling and rollback.
- **Acceptance:**
  - New PostgreSQL function in database: `approve_order_and_deduct_inventory()`
  - Function updates order status AND deducts materials atomically
  - If any material insufficient or error occurs, entire transaction rolls back
  - Hook calls `supabase.rpc('approve_order_and_deduct_inventory', { order_id, user_id })`
  - Old code removed or deprecated
- **Dependencies:** Task #4 (migration to create RPC function)
- **Reference:** `rules/CLAUDE.md` (data integrity), `memory/decisions.md` line 189-206

#### Task #31: Setup Dependabot Dependency Scanning
- **Location:** GitHub repository settings
- **Effort:** 30 minutes
- **Description:** Enable Dependabot in GitHub repository (Settings → Security & analysis). Configure to:
  - Enable Dependabot alerts (automatic)
  - Enable Dependabot security updates (auto-PR for vulnerable deps)
  - Set minimum severity: moderate (ignore low)
  - Schedule: daily or weekly
  - Add `npm audit` to CI/CD pipeline (GitHub Actions)
- **Acceptance:**
  - Dependabot alerts enabled in repo Security tab
  - Auto-PR creation configured for high/critical vulnerabilities
  - CI fails on `npm audit` if vulnerabilities found (or at least reports)
- **Dependencies:** None
- **Reference:** `rules/CYBERSECURITY_MASTERY.md` lines 857-927

---

## 🟡 TIER 2: CORE FIXES & UX IMPROVEMENTS

**Can be done in parallel with Tier 1 or after. Not security blockers but important for QA.**

### Debug Logging & Code Quality

#### Task #5: Clean Up Debug Console Logs
- **Files:** 4 locations:
  - `src/lib/hooks/useProductionOrders.ts:134`
  - `src/lib/hooks/useInventoryMaterials.ts:104`
  - `src/lib/hooks/useConcretePlants.ts:75`
  - `src/lib/hooks/useTeamMembers.ts:75`
- **Effort:** 30 minutes
- **Description:** Remove all `console.log` statements. Keep `console.error` for actual errors only. Run `npm run lint` to catch any remaining. These logs leak info and impact performance.
- **Acceptance:** `grep -r "console.log" src/` returns 0 results in production code (test code OK)
- **Dependencies:** None

---

### Navigation & Routing

#### Task #6: Fix Broken Navigation Links
- **File:** `src/components/layout/Header.tsx`
- **Lines:** 20, 23
- **Effort:** 15 minutes
- **Description:** Fix broken nav links:
  - Line 20: `href="/production"` → `href="/orders"` (actual orders page)
  - Line 23: `href="/reports"` → either create `/reports` page (Phase 7) OR remove link from nav
- **Acceptance:** All nav links navigate to existing pages (no 404s)
- **Dependencies:** None

---

### Performance

#### Task #8: Add Debounce to Search Input
- **File:** `src/app/orders/page.tsx`
- **Lines:** 139 (search input onChange)
- **Effort:** 30 minutes
- **Description:** Create `useDebounce` hook (or use lodash debounce). Apply 300ms delay to `searchTerm` state updates. Prevents excessive re-renders and API queries on every keystroke.
- **Acceptance:**
  - New hook: `src/lib/hooks/useDebounce.ts`
  - Search only fires after user stops typing for 300ms
  - Test: typing "bloque" triggers search once, not on each letter
- **Dependencies:** None
- **Performance target:** <500ms search response after debounce (PERFORMANCE.md)

---

### Inventory Management - Add Dialogs (4 tasks)

#### Task #9: Build AddMaterialDialog Component
- **Files:** New `src/components/inventory/AddMaterialDialog.tsx`, update `src/components/inventory/InventoryPanel.tsx:103`
- **Effort:** 1 hour
- **Description:** Create modal dialog with form to add new material. Fields: name (text), category (select: cement, sand, aggregate, additive, other), unit (text: kg, ton, m³), current_quantity (number), min_stock_quantity (number), unit_cost (number). Validation: required fields, positive numbers. Wire to "Agregar Material" button in InventoryPanel Materials tab.
- **Acceptance:**
  - Dialog opens/closes properly
  - Form validates inputs
  - On submit: calls `useInventoryMaterials().addMaterial()` and refreshes list
- **Dependencies:** None

#### Task #13: Build AddPlantDialog Component
- **Files:** New `src/components/inventory/AddPlantDialog.tsx`, update `InventoryPanel.tsx:184`
- **Effort:** 1 hour
- **Description:** Dialog for adding concrete plants. Fields: name, location, capacity (number, blocks per day), hourly_cost (number). Wire to "Agregar Planta" button in Plants tab.
- **Acceptance:** Dialog functional, data saved via `useConcretePlants().addPlant()`
- **Dependencies:** None

#### Task #14: Build AddEquipmentDialog Component
- **Files:** New `src/components/inventory/AddEquipmentDialog.tsx`, update `InventoryPanel.tsx:230`
- **Effort:** 1 hour
- **Description:** Dialog for adding equipment. Fields: name, type (select: mixer, palletizer, conveyor, other), hourly_rate, fuel_rate, maintenance_cost. Wire to "Agregar Equipo" button in Equipment tab.
- **Acceptance:** Dialog functional, data saved via `useEquipment().addEquipment()`
- **Dependencies:** None

#### Task #15: Build AddTeamMemberDialog Component
- **Files:** New `src/components/inventory/AddTeamMemberDialog.tsx`, update `InventoryPanel.tsx:286`
- **Effort:** 1 hour
- **Description:** Dialog for adding team members. Fields: name, role (text), hourly_rate, specialty (text). Wire to "Agregar Integrante" button in Team tab.
- **Acceptance:** Dialog functional, data saved via `useTeamMembers().addTeamMember()`
- **Dependencies:** None

**Note:** Tasks #9, #13, #14, #15 can be done in parallel by multiple developers.

---

### Pagination & Localization

#### Task #10: Update Pagination to 50 Items Per Page
- **Files:**
  - `src/lib/hooks/useProductionOrders.ts:68`
  - `src/lib/hooks/useInventoryMaterials.ts:40`
- **Effort:** 10 minutes
- **Description:** Change `perPage` default from `25` to `50` to match PERFORMANCE.md specification. Improves efficiency by reducing API calls.
- **Acceptance:** Both hooks default to 50 items per page
- **Dependencies:** None
- **Reference:** `rules/PERFORMANCE.md` (implied)

#### Task #11: Fix Currency Format to CLP
- **File:** `src/components/inventory/InventoryPanel.tsx`
- **Lines:** 155, 158 (hardcoded `$`)
- **Effort:** 20 minutes
- **Description:** Replace `$` symbol with CLP currency format using `Intl.NumberFormat`. Create helper if not exists: `formatCurrency(amount: number): string` using `'es-ES'` locale, currency 'CLP', 0 fraction digits.
- **Acceptance:** All currency displays show "CLP $123.456" or "$123.456" (Chilean format, not USD)
- **Dependencies:** None

---

## 🟢 TIER 3: FEATURE COMPLETION & QA

**After Tier 1 (security) and ideally Tier 2 (core fixes) complete.**

### Export Functionality (Phase 7)

#### Task #12: Implement Export Functionality
- **Files:** New `src/lib/utils/exporter.ts`, new `src/components/reports/ReportGenerator.tsx` (or add to dashboard/orders)
- **Effort:** 1-2 days
- **Description:** Create Excel/CSV/JSON export system:
  1. `exporter.ts`: functions `exportOrdersToExcel(orders)`, `exportCostsToExcel(orders)`, `exportInventoryToExcel(items)`, `exportToCSV(data)`, `exportToJSON(data)` using `xlsx` library (already installed)
  2. `ReportGenerator.tsx`: UI with date range picker, format selector (Excel/CSV/PDF/JSON), template selection (Daily/Weekly/Monthly), include options, preview table, download button
  3. Wire to Dashboard or Orders page (maybe Dashboard "Export" button)
- **Acceptance:**
  - User can select date range, format, and generate export
  - Exported files contain correct data (orders, costs, inventory)
  - Download triggers correctly
  - PDF optional if time (can skip for MVP)
- **Dependencies:** Tier 1 & 2 recommended (have stable data structure)
- **Reference:** Project plan Phase 7 (`memory/project-context.md` lines 331-348)

---

### Quality Assurance

#### Task #16: Complete Manual Testing Checklist
- **Effort:** 2-3 hours
- **Description:** Execute comprehensive manual test plan:
  - Real-time: 2 browser tabs → operator creates order → engineer sees <2s
  - RLS: operator login → only own orders visible (attempt SQL injection via UI to bypass)
  - Rollback: disconnect network → create order → verify error toast + UI revert
  - Cost accuracy: manually calculate order cost vs displayed total
  - Inventory sync: approve order → verify materials deducted from inventory
  - Mobile: test on <768px width (Chrome DevTools), all features usable
  - Accessibility: keyboard navigation only, focus visible, screen reader basic check
  - All forms: validation messages, required fields, error states
- **Acceptance:** All test cases pass, no critical bugs found. Document results in `docs/testing-results.md`.
- **Dependencies:** Tier 1 & 2 complete (stable, secure code)

#### Task #17: Run Lint and Build Verification
- **Effort:** 30 minutes
- **Description:** Run `npm run lint` and fix all TypeScript/ESLint errors (no warnings if possible). Run `npm run build` to ensure production build succeeds with no errors. Fix any type errors, unused imports, console.logs missed.
- **Acceptance:**
  - `npm run lint` → 0 errors, ideally 0 warnings
  - `npm run build` → successful, bundle size acceptable (<200KB gzipped ideally)
- **Dependencies:** All code complete, ready for build

#### Task #18: Verify Performance Targets
- **Effort:** 1 hour
- **Description:** Run performance audits:
  - Lighthouse (Chrome DevTools) on dashboard and orders pages
  - Page load <2s on throttled "Slow 3G" connection
  - First Contentful Paint <1.8s, Largest Contentful Paint <2.5s
  - Search response <500ms after debounce (measure with console.time)
  - Optimistic updates perceived <50ms (subjective test)
  - Bundle size analysis: `npm run build` output
- **Acceptance:** All PERFORMANCE.md targets met or justified exceptions documented
- **Dependencies:** Task #17 (production build), debounce implemented (Task #8)

---

## 🔵 TIER 4: FINALIZATION

### Documentation & Wrap-Up

#### Task #19: Final Review and Documentation Update
- **Effort:** 2-4 hours
- **Description:** Comprehensive documentation finalization:
  - Update `README.md` with:
    - Setup instructions (env vars, Supabase setup, migrations)
    - Deployment guide (Vercel, environment variables)
    - User roles and permissions
    - Troubleshooting
  - Update `memory/*.md` files with final state:
    - `project-context.md`: current completion status, any architectural changes
    - `active-tasks.md`: mark all tasks complete, add final notes
    - `decisions.md`: any new decisions made during implementation
    - `lessons-learned.md`: what worked, what didn't, security gaps discovered
  - Update `CLAUDE.md` if any patterns changed
  - Create `docs/DEPLOYMENT.md` with step-by-step production deployment
  - Verify all UI text is Spanish (search for English words)
- **Acceptance:**
  - README complete and accurate
  - All memory files updated with final state
  - Deployment docs ready for ops team (or self)
  - No English text in UI (except maybe technical terms)
- **Dependencies:** Tier 3 complete (app fully built and tested)

---

## 📌 Summary Table

| ID | Tier | Task | Hours | Priority | Dependencies |
|----|------|------|-------|----------|--------------|
| 20 | 1 | Hide cost column (orders list) | 0.25 | 🔴 Critical | None |
| 21 | 1 | Hide cost breakdown (details modal) | 0.5 | 🔴 Critical | None |
| 22 | 1 | Hide cost KPI (dashboard) | 0.25 | 🔴 Critical | None |
| 23 | 1 | Hide cost column (dashboard table) | 0.25 | 🔴 Critical | None |
| 24 | 1 | Verify charts data isolation | 0.25 | 🔴 Critical | #20-23 |
| 25 | 1 | Rate limiting on auth | 2 | 🔴 Critical | None |
| 26 | 1 | Account lockout | 2 | 🔴 Critical | #25 (optional) |
| 27 | 1 | Security headers middleware | 1 | 🔴 Critical | None |
| 28 | 1 | Environment validation | 0.5 | 🔴 Critical | None |
| 29 | 1 | Password strength validation | 1 | 🔴 Critical | None |
| 30 | 1 | Audit logging system | 8 | 🔴 Critical | #4 |
| 31 | 1 | Dependabot setup | 0.5 | 🔴 Critical | None |
| 32 | 1 | Error response sanitization | 1 | 🔴 Critical | None |
| 3 | 1 | Verify RLS policies | 0.5 | 🔴 Critical | None |
| 4 | 1 | Database migration files | 1 | 🔴 Critical | #3 |
| 7 | 1 | Atomic order approval transaction | 2 | 🔴 Critical | #4 |
| 5 | 2 | Clean debug logs | 0.5 | 🟡 High | None |
| 6 | 2 | Fix navigation links | 0.25 | 🟡 High | None |
| 8 | 2 | Add debounce to search | 0.5 | 🟡 High | None |
| 9 | 2 | Build AddMaterialDialog | 1 | 🟡 Medium | None |
| 13 | 2 | Build AddPlantDialog | 1 | 🟡 Medium | None |
| 14 | 2 | Build AddEquipmentDialog | 1 | 🟡 Medium | None |
| 15 | 2 | Build AddTeamMemberDialog | 1 | 🟡 Medium | None |
| 10 | 2 | Update pagination to 50 | 0.25 | 🟡 Low | None |
| 11 | 2 | Fix currency format to CLP | 0.25 | 🟡 Low | None |
| 12 | 3 | Implement export functionality | 16 | 🟢 Feature | Tier 1-2 rec |
| 16 | 3 | Manual testing checklist | 2.5 | 🟢 QA | Tier 1-2 |
| 17 | 3 | Lint and build verification | 0.5 | 🟢 QA | All code done |
| 18 | 3 | Performance verification | 1 | 🟢 QA | #17 |
| 19 | 4 | Final documentation | 3 | 🔵 Final | Tier 3 |

**Total Hours:** ~60-83 hours (realistic with parallel work: ~2 weeks with 1 developer)

---

## 🎯 Execution Strategy

### Week 1: Security Foundation (Tier 1)
- Days 1-2: Complete all cost confidentiality tasks (#20-24) - quick wins
- Days 3-4: Authentication hardening (#25-26, #29)
- Day 5: Headers + env validation + error sanitization (#27-28, #32)
- Parallel: RLS verification (#3) and migrations (#4) ongoing

### Week 2: Security Completion + Core Fixes (Tier 1-2)
- Day 1: Audit logging (#30) - biggest task, may spill to day 2
- Day 2: Atomic transaction (#7), Dependabot (#31)
- Day 3: All Tier 2 tasks in parallel (dialogs, pagination, currency, nav, debounce, logs)
- Day 4: Buffer for security tasks overruns, begin Tier 3 if time

### Week 3: Features & QA (Tier 3)
- Days 1-2: Export functionality (#12)
- Day 3: Manual testing (#16), fix any bugs found
- Day 4: Lint/build (#17), performance verification (#18)
- Day 5: Bug fixes from testing, prepare for staging

### Week 4: Finalization (Tier 4)
- Day 1-2: Documentation update (#19)
- Day 3: Final review, security checklist sign-off
- Day 4: Deploy to production (staging first, then prod)
- Day 5: Monitor production, incident response ready

---

## 🔗 Dependencies Graph

```
Tier 1:
  #20-24 (cost hiding) ──────┐
  #25 (rate limit) ────────┐ │
  #26 (lockout) ──────────┐ │ │
  #27 (headers) ─────────┤ │ │
  #28 (env val) ─────────┤ │ │
  #29 (password) ────────┤ │ │
  #30 (audit logging) ───┤ │ │
  #31 (Dependabot) ──────┤ │ │
  #32 (errors) ──────────┤ │ │
  #3 (RLS verify) ───────┘ │ │
  #4 (migrations) ────────┘ │
  #7 (atomic txn) ─────────┘ (can start after #4)

All Tier 1 independent except:
  #24 needs #20-23
  #30 needs #4 (migration for audit_logs table)
  #7 needs #4 (migration for RPC function)

Tier 2:
  All tasks independent, can parallel with Tier 1
  Only recommendation: complete before Tier 3

Tier 3:
  #12 (export) needs stable data model → Tier 1 complete recommended
  #16 (testing) needs stable code → Tier 1-2 complete required
  #17 (build) needs all code done
  #18 (performance) needs #8 (debounce) and build

Tier 4:
  #19 needs Tier 3 complete
```

---

## ✅ Completion Sign-Off Criteria

Before marking MVP complete, verify:

- [ ] All Tier 1 tasks complete (security hardening)
- [ ] All Tier 2 tasks complete (core UX)
- [ ] All Tier 3 tasks complete (features + QA)
- [ ] All Tier 4 tasks complete (documentation)
- [ ] Manual testing checklist passed (Task #16)
- [ ] No TypeScript errors, successful build (Task #17)
- [ ] Performance targets met (Task #18)
- [ ] RLS policies verified with screenshots (Task #3)
- [ ] Audit logging operational and tested (Task #30)
- [ ] Cost data hidden from operators tested (Tasks #20-24)
- [ ] Rate limiting and lockout tested (Tasks #25-26)
- [ ] Security headers present in production (Task #27)
- [ ] Migration files created and tested (Task #4)
- [ ] Atomic transaction verified (Task #7)
- [ ] README and deployment docs complete (Task #19)
- [ ] All UI text Spanish verified
- [ ] No debug console.logs remaining

---

## 📝 Notes

- **Task numbering** aligns with `active-tasks.md` meta-summary tasks
- Individual tasks reference specific files, lines, and acceptance criteria
- Effort estimates are realistic for 1 developer; parallel work reduces calendar time
- **Do not skip Tier 1** — these are security/confidentiality requirements, not "nice-to-haves"
- Audit logging (#30) is largest effort (8h) but critical for incident response
- Export functionality (#12) is largest feature but can be deferred to v1.1 if needed (MVP core is production orders, not reporting)
- This plan assumes 1 developer; adjust if you have 2+ developers (can parallelize dialogs, etc.)

---

**Next Action:** Start with Task #20 (hide cost column) → demonstrates immediate value + fixes critical confidentiality breach.
