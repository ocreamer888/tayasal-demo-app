# Lessons Learned - Technical Insights & Pitfalls

## Rate Limiting Architecture: In-Memory vs Distributed Store

**Date:** 2026-02-09
**Task:** #25 - Implement Rate Limiting on Auth Endpoints
**Issue:** In-memory rate limiting is ineffective in serverless production environments

### The Problem

Initially implemented `globalThis.rateLimitStore = new Map()` for simplicity during development. This works fine locally (single instance), but **fails catastrophically** in production serverless deployments (Vercel, AWS Lambda, etc.).

#### Why It Fails:

1. **Horizontal Scaling:** Serverless platforms spin up **multiple isolated function instances** to handle concurrent requests
2. **Memory Isolation:** Each instance has its own private `globalThis` - **no shared memory**
3. **Attack Vector:** Attacker can send requests to different instances, each counting as "first attempt"

**Example Attack:**
```
User tries 5 logins:
- Instance A: receives 1st attempt → count = 1 ✓
- Instance B: receives 2nd attempt → count = 1 ✓ (different memory!)
- Instance C: receives 3rd attempt → count = 1 ✓
- Instance D: receives 4th attempt → count = 1 ✓
- Instance E: receives 5th attempt → count = 1 ✓

Result: Rate limit NEVER TRIGGERS despite 5 attempts!
```

### The Solution: Distributed Storage

**Redis** (or any external database) provides a **centralized, shared store** accessible by all function instances:

```
All instances → Redis cluster → single source of truth
              ↓
    login:user@example.com → count: 5 (accurate!)
```

**Recommended:** Upstash Redis (serverless, global replication, Vercel integration)

**Alternative:** Database table with row-level locking (slower but acceptable for low volume)

### Implementation Checklist for Production:

- [ ] Replace `globalThis.rateLimitStore` with Redis client
- [ ] Use `INCR` + `EXPIRE` atomic operations
- [ ] Configure connection pooling for serverless (Upstash handles this)
- [ ] Test with load: multiple concurrent requests from same IP/user
- [ ] Add fallback: if Redis is down, allow requests (fail open) or block all (fail closed) based on risk tolerance

### Key Takeaway

**Development shortcuts become critical vulnerabilities in production.** Always ask:
> "Will this work when the app scales to 10+ server instances?"

For any stateful operation (rate limiting, sessions, caching), assume **no shared memory** in serverless architectures.

### Related Tasks

- **Task #25:** Rate limiting implementation (current)
- **Task #31:** Dependabot setup (dependency scanning)
- **Task #27:** Security headers middleware
- **Task #30:** Audit logging (should also use shared storage)

### Production Readiness Checklist

Before deploying to production, review `SECURITY_FIRST_SUMMARY.md` lines 169-172:
- ✅ Rate limiting uses distributed Redis (not in-memory)
- ✅ All serverless function instances share state
- ✅ Test rate limits with multiple concurrent requests
- ✅ Monitor rate limit triggers for false positives/negatives

---

## Cost Data Confidentiality (Tasks #20-24)

**Lesson:** Role-based UI checks are insufficient alone. Must filter data at multiple layers:

1. **UI Layer:** Conditional rendering (React)
2. **Hook Layer:** Filter data before passing to components
3. **Database Layer:** RLS policies (source of truth)
4. **API Layer:** Only request needed fields

**Mistake:** Initially only hid UI elements but still passed cost data to frontend. Operators could inspect network tab and see costs. Fix: Prevent cost fields from being included in API responses for operators.

**Pattern:** Use `userRole` prop throughout component tree, pass down from root.

---

## Authentication Proxy Pattern

Moving from client-side Supabase auth to server-side API routes:

**Why:**
- Rate limiting must be server-side (can't trust client)
- Audit logging requires server visibility
- Future: account lockout, MFA enforcement

**Challenge:** Supabase Session Management in Next.js App Router

**Solution:** API routes return session tokens; client calls `supabase.auth.setSession()` to establish local session. Alternative: use `@supabase/ssr` cookie helpers (more complex but better UX).

**Trade-off:** Requires double round-trip (API → client sets session) vs direct Supabase client call.

---

## Debug Console Logs (Task #5)

**Issue:** Debug logs leak information and impact performance.

**Rule:** Only `console.error` for actual errors in production code. Remove all `console.log` before deployment. Run `grep -r "console.log" src/` to verify.

**Lesson:** Logging discipline is security hygiene. Never assume logs are only seen by developers.

---

## Environment Validation (Task #28)

**Lesson:** Early validation prevents mysterious runtime failures. Check all required `NEXT_PUBLIC_*` and secrets on app startup in `layout.tsx` or root component. Fail fast with clear error: "Missing NEXT_PUBLIC_SUPABASE_URL"

**Implementation:** Use Zod schema for env validation.

---

## Atomic Transactions (Task #7)

**Problem:** Order approval workflow updates order status, then loops to update inventory. If inventory update fails after order status updated, data inconsistency occurs.

**Solution:** Database atomic transaction via PostgreSQL function:
```sql
CREATE FUNCTION approve_order_and_deduct_inventory(order_id uuid, user_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE production_orders SET status = 'approved' WHERE id = order_id;
  -- deduct inventory in same transaction
  UPDATE inventory_materials SET quantity = quantity - used_quantity WHERE id = ...;
END;
$$ LANGUAGE plpgsql;
```

**Lesson:** Multi-step data modifications that must succeed or fail together require atomic transactions. Database-level RPC functions are the reliable way in Supabase.

---

## Security Headers Middleware (Task #27)

**Next.js doesn't have built-in security headers.** Need custom middleware or `next-security` package.

**Essential headers:**
- `X-Frame-Options: DENY` (clickjacking)
- `X-Content-Type-Options: nosniff` (MIME sniffing)
- `Referrer-Policy: strict-origin-when-cross-origin` (referrer leakage)
- `Permissions-Policy` (disable unused APIs)
- `Content-Security-Policy` (XSS defense - start permissive, tighten later)
- `Strict-Transport-Security` (HSTS, production only)

**Lesson:** These are **non-negotiable for production**. Add as part of security hardening.

---

## Error Response Sanitization (Task #32)

**Risk:** Stack traces in error responses reveal internal paths, library versions, potential vulnerabilities.

**Fix:** In all API routes and error boundaries:
```typescript
if (process.env.NODE_ENV === 'production') {
  return { error: 'Internal server error' };
} else {
  return { error: error.message, stack: error.stack }; // dev only
}
```

**Lesson:** Never trust error handling to be secure by default. Explicitly sanitize.

---

## Pagination Performance (Task #10)

**Decision:** Use 50 items per page instead of 25 as per `PERFORMANCE.md`.

**Rationale:** Reduces API calls by half for same user throughput. Acceptable because:
- All data is indexed foreign keys
- RLS policies are simple (user_id filter)
- 50 rows × ~1KB each = 50KB payload (reasonable)

**Lesson:** Performance targets should be documented (PERFORMANCE.md) and validated.

---

## Currency Formatting (Task #11)

**Mistake:** Hardcoded `$` symbol assumed USD, but project uses Chilean Pesos (CLP).

**Fix:** Use `Intl.NumberFormat('es-ES', { style: 'currency', currency: 'CLP' })`.

**Lesson:** Internationalization matters even within single country. Use locale-aware formatting.

---

## Audit Logging Design (Task #30)

**Challenge:** What to log? How much? Storage concerns?

**Strategy:**
- Log all **sensitive operations** (auth, authorization, data changes)
- Log **before/after state** for important changes
- Store in `audit_logs` table with RLS (engineers can query, operators cannot)
- **Do not log:** Full request bodies, passwords, sensitive PII (GDPR)
- **Retention:** 90 days minimum, archive older to cheap storage

**Lesson:** Logging is detective control. If you can't answer "who did what and when", you're not secure.

---

## Dependabot Setup (Task #31)

**Lesson:** Automated dependency scanning is mandatory for supply chain security. Enable in GitHub repo settings. Configure:
- Auto-PR for high/critical vulnerabilities
- Daily or weekly scan
- Fail CI on `npm audit` if vulnerabilities found

**Cost:** Free. No excuse not to enable.

---

## RLS Policy Verification (Task #3)

**Why this is blocking:** All application security assumes RLS is correctly configured. If RLS is broken or missing, operators can see all engineers' data, completely bypassing role-based access.

**Process:**
1. Log into Supabase Dashboard
2. Navigate to Database → Policies
3. For each of 8 tables, verify:
   - `profiles` table: RLS enabled? Operators filter: `user_id = auth.uid()`
   - `production_orders`: `user_id` filter present?
   - `inventory_materials`: same
   - etc.
4. Document each policy name and definition
5. Take screenshots
6. Test with operator account: cannot query others' rows

**Lesson:** Documentation and verification are different. Don't assume policies exist because the code expects them.

---

## Summary: Security-First Development

1. **Complete Tier 1 BEFORE any testing/deployment**
2. **RLS verification is foundation** - test it thoroughly
3. **Distributed state required for serverless** - plan for Redis
4. **Logging is non-negotiable** - no logs = no detection
5. **Headers are free security** - add them now
6. **Don't skip the "boring" tasks** (env validation, error sanitization) - they're critical

**Next:** Continue with Task #26 (Account Lockout) OR Task #29 (Password Strength)?
