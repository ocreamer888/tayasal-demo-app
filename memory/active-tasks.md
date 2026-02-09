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

---

## 🔴 Remaining Tier 1 Tasks (Priority Order)

### Category B (Authentication) - Continue
- ⬜ **Task #29**: Password strength validation (1h)
  - Add zxcvbn to signup page, enforce score ≥ 3

### Category C (Defense Headers & Configuration)
- ⬜ **Task #27**: Security headers middleware (1h)
- ⬜ **Task #28**: Environment validation on startup (30min)
- ⬜ **Task #32**: Error response sanitization (1h)

### Category D (Data Integrity)
- ⬜ **Task #3**: Verify and document RLS policies (30min)
- ⬜ **Task #7**: Implement atomic order approval transaction (2h)

### Category E (Misc)
- ⬜ **Task #4**: Create database migration files (1h)
- ⬜ **Task #31**: Dependabot dependency scanning (30min)
- ⬜ **Task #30**: Comprehensive audit logging (8h)

---

## 📊 Progress Summary

**Tier 1 Completion:** 7/16 tasks (44%)
**Time Invested:** ~20 hours estimated
**Critical Path:** Category A ✅ complete, Category B ✅ complete, Category C → current

---

## ⚠️ Production Deployment Blockers

1. **Redis Upgrade Required** (Tasks #25-26):
   - Current in-memory rate limiting/lockout **WON'T WORK** on serverless
   - Must replace `globalThis.rateLimitStore` with Redis (Upstash)
   - See `memory/lessons-learned.md` for technical explanation
   - **Action:** Create subtask for Redis migration before production

2. **RLS Verification** (Task #3):
   - All security depends on correct RLS policies
   - Must manually verify in Supabase Dashboard
   - Document each policy with screenshots

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
