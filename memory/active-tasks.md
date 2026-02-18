# Active Tasks - Current Work in Progress

**Last Updated:** 2026-02-09
**Current Session:** Security hardening sprint (Tier 1)

---

## ✅ Completed in this session

### Tier 1: Security Hardening - Category A (Cost Confidentiality)
- ✅ **Task #20**: Hide cost column in orders list
  - File: `src/components/production/ProductionOrderList.tsx`
  - Impact: Operators see "-" instead of cost values
- ✅ **Task #21**: Hide cost breakdown in order details modal
  - File: `src/components/production/ProductionOrderDetails.tsx`
  - Impact: Operators don't see materials/labor/equipment cost breakdown
- ✅ **Task #22**: Hide cost KPI in dashboard
  - File: `src/components/dashboard/ProductionDashboard.tsx`
  - Impact: "Costo Promedio" hidden from operators
- ✅ **Task #23**: Hide cost column in dashboard recent orders
  - File: `src/components/dashboard/ProductionDashboard.tsx`
  - Impact: Cost column only visible to engineers/admins
- ✅ **Task #24**: Verify charts data isolation
  - File: `src/components/dashboard/ProductionDashboard.tsx`
  - Impact: Production data filtered to exclude `costo` field for operators

### Tier 1: Security Hardening - Category B (Authentication)
- ✅ **Task #25**: Implement rate limiting on auth endpoints
  - Files created:
    - `src/lib/rate-limit.ts` (in-memory store, needs Redis for production)
    - `src/app/api/auth/login/route.ts`
    - `src/app/api/auth/signup/route.ts`
  - Config: Login: 5 attempts/15min per email, 20/15min per IP
  - Config: Signup: 3 attempts/hour per email, 10/hour per IP
  - Updated: `src/app/login/page.tsx`, `src/app/signup/page.tsx` to use API routes
- ✅ **Task #26**: Implement account lockout mechanism
  - File: `src/lib/rate-limit.ts` (extended)
  - Config: 5 failed attempts → 1 hour lock
  - Integrated into login API route
- ✅ **Task #29**: Password strength validation
  - File: `src/app/signup/page.tsx`
  - Added zxcvbn library, real-time strength meter, checklist
  - Enforced minimum score 3 ("Fuerte") and 12+ characters

---

### Tier 1: Security Hardening - Category C (Defense Headers & Configuration)
- ✅ **Task #27**: Security headers middleware
  - File: `src/middleware.ts` (created)
  - Headers: X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy, CSP, HSTS (prod)
  - CSP configured with Supabase URLs (`https://...supabase.co wss://...supabase.co`)
- ✅ **Task #28**: Environment validation on startup
  - File: `src/lib/env-validation.ts` (created)
  - Zod schema validates required env vars: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - Warns if `SUPABASE_SERVICE_ROLE_KEY` missing in production
  - Called in `src/app/layout.tsx` → fails fast on misconfiguration
- ✅ **Task #32**: Error response sanitization
  - File: `src/lib/error-handler.ts` (created)
    - `getClientErrorMessage(error, default?)` - returns full error in dev, generic in prod
    - `createErrorResponse(error, status, default?)` - logger + sanitized JSON response
  - Updated `src/app/api/auth/signup/route.ts` to use sanitization:
    - Replaced `error.message` with `getClientErrorMessage(error, 'No se pudo crear la cuenta...')`
    - Prevents leakage of "User already registered", DB constraint errors, etc.
  - Login route already used generic messages (maintained)
  - All API routes now prevent stack traces, internal paths, or sensitive details in responses
  - Full errors still logged server-side via `console.error` for debugging

---

## ✅ Completed in this session

### Category D (Data Integrity)
- ✅ **Task #3**: Verify and document RLS policies (30min)
  - **FOUNDATIONAL** - All security depends on this
  - **Status:** Completed 2026-02-10 by Marco
  - **Verification:** All 23 policies exist across 6 tables ✅
  - **Critical:** `production_orders` role-based policies verified (engineers/admins see all, operators see own)
  - **Documents:** `RLS_VERIFICATION_CHECKLIST.md`, `RLS_VERIFICATION_REPORT.md`, `src/migrations/001_rls_policies_backup.sql`
- ✅ **Task #7**: Implement atomic order approval transaction (2h)
  - Prevent inventory/order data corruption
  - **Created:** `src/migrations/002_atomic_approval_transaction.sql`
    - PostgreSQL function: `approve_order_with_inventory_deduction()`
    - Single transaction updates order status AND deducts inventory
    - Row-level locking (`FOR UPDATE`) prevents race conditions
    - Returns JSON with success/error details, specific error codes
    - SECURITY DEFINER ensures proper access despite RLS
  - **Updated:** `src/lib/hooks/useProductionOrders.ts`
    - `updateOrderStatus()` now uses RPC call to atomic function
    - Optimistic UI update with automatic rollback on error
    - Removed ~30 lines of manual Promise.all logic
    - Handles edge cases: already approved, insufficient permissions, missing materials

### Category E (Misc)
- ✅ **Task #31**: Setup Dependabot dependency scanning (30min)
  - Created `.github/dependabot.yml` for automated security updates
  - Created `.github/workflows/ci.yml` with npm audit check
  - CI pipeline: lint → tests → npm audit (moderate+) → build
  - ✅ Manual activation: Dependabot enabled in GitHub Settings
  - 🐛 Found & fixed vulnerabilities during setup:
    - Removed unused `xlsx` package (2 high vulnerabilities)
    - Fixed `qs` vulnerability via `npm audit fix`
  - Result: **0 vulnerabilities** (verified with `npm audit`)

## 🔴 Remaining Tier 1 Tasks (Priority Order)

### Audit Logging (Biggest effort)
- ⬜ **Task #30**: Comprehensive audit logging (8h)

---

## 📊 Progress Summary

**Tier 1 Completion:** 14/15 tasks (93%)
**Time Invested:** ~28 hours estimated
**Status:** Category A ✅, B ✅, C ✅, D ✅, E (partial). Only Task #30 remaining.

---

## ⚠️ Production Deployment Blockers

1. **Redis Upgrade Required** (Tasks #25-26):
   - Current in-memory rate limiting/lockout **WON'T WORK** on serverless
   - Must replace `globalThis.rateLimitStore` with Redis (Upstash)
   - See `memory/lessons-learned.md` for technical explanation
   - **Action:** Create subtask for Redis migration before production

---

## 🎯 Next Recommendations

**Option 1: Continue Authentication Hardening**
- Task #29 (Password strength) → Task #27-28-32 (Headers/Env/Errors)
- Fastest path through remaining Category B & C

**Option 2: Break to verify RLS policies**
- Task #3 is foundational; verify now to catch issues early
- Informs whether data isolation actually works

**Option 3: Atomic transaction (Task #7)**
- Important for data integrity but not blocking immediate testing
- Can be done parallel with other tasks

**Recommended:** Task #29 (password strength) next - quick win, completes auth hardening.

---

## 📝 Notes

- In-memory rate limiting is **development-only**; Redis upgrade needed before production
- Cost confidentiality ✅ fully implemented (5 locations checked)
- Auth API routes now proxy via server (more secure, enables rate limiting)
- All changes tracked in individual task records via TaskCreate/TaskUpdate
- **Task #31 (Dependabot):** ✅ Complete
  - Repository files created (`.github/dependabot.yml`, `.github/workflows/ci.yml`)
  - Dependabot manually enabled in GitHub Settings
  - Vulnerabilities discovered and fixed during setup:
    - Removed unused `xlsx` package (2 high severity)
    - Upgraded `qs` package (1 low severity)
  - Final audit status: **0 vulnerabilities**

---

## 🎨 Tier 2 UX Improvements (Charts Responsiveness)

**Chart Layout Enhancement** (2026-02-09):
- Made ProductionDashboard charts fully fluid (horizontal + vertical)
- Changes in `src/components/dashboard/ProductionDashboard.tsx`:
  - Grid: `grid-cols-1 gap-4 auto-rows-1fr` + `w-full`
  - ChartContainer: `w-full max-w-9xl min-h-[300px] flex-1`
  - CardContent: `w-full px-4` + `flex-1`
  - Removed `min-w-0` constraints
- Result: Charts now grow/shrink responsively with container, maintaining minimum height of 300px
- Supports flexible dashboard layouts without scrollbars or overflow issues

**Note:** These improvements enhance UX but are not security blockers. Can continue alongside Tier 1.

