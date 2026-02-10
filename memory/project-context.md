# Project Context

**Last Updated:** 2026-02-09
**Branch:** main
**Status:** ✅ **Working - Authentication functional, dashboard accessible**

---

## Current State

### What's Working
- ✅ **Authentication flow complete**: Login → redirect → dashboard render
- ✅ **CSP configured** with Supabase API + WebSocket (`connect-src`)
- ✅ **AuthContext**: Non-blocking profile fetch, proper loading state
- ✅ **Dashboard displays**: Charts, tables, role-based data filtering
- ✅ **TypeScript compilation**: All errors resolved (Zod v4, zxcvbn types, etc.)
- ✅ **Production build**: `npm run build` succeeds
- ✅ **Responsive sidebar navigation**: Desktop fixed sidebar + mobile header with sheet
- ✅ **Green gradient theme**: Consistent use of `from-green-900/20 to-green-800/20` (sidebar/panels) and `from-green-900 to-green-800` (main backgrounds)
- ✅ **Standardized page layout**: All protected pages (Dashboard, Orders, Inventory) follow same layout composition pattern
- ✅ **Toast notifications**: Using `sonner` for success/error feedback
- ✅ **Role-based navigation filtering**: Nav items gated by user role (operators don't see "Reportes")

### Known Issues
- ⚠️ **In-memory rate limiting** (needs Redis for production)
- ⚠️ **Middleware deprecation** warning (Next.js 16 - `middleware` → `proxy`)
- ⚠️ **Subscription scoping bug** fixed, but pattern documented for future reference

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16.1.6 (App Router, Turbopack) |
| UI | React 19.2.4, shadcn/ui, Tailwind CSS v4 |
| Auth | Supabase Auth (client + server-side API routes) |
| Database | Supabase PostgreSQL (RLS enforced) |
| Charts | Recharts |
| Date | date-fns |
| Validation | Zod v4 |
| TypeScript | 5.x |

---

## Architecture Highlights

### Authentication Pattern
- API routes (`/api/auth/login`, `/api/auth/signup`) handle server-side rate limiting, logging
- Client calls `supabase.auth.setSession()` to establish session
- `AuthContext` listens to `onAuthStateChange` to update global state
- Login page uses `useAuth()` hook + `useEffect` to navigate on `user` change
- **No manual timeouts or event ordering hacks**

### Data Access Pattern
- Custom hooks (`useProductionOrders`, `useInventoryMaterials`) encapsulate data + mutations
- Real-time subscriptions auto-managed
- Role-based query filtering (operators see own data only via RLS + query filter)
- Optimistic UI updates with rollback on error

### Security Hardening
- **CSP**: `connect-src` includes Supabase API + WebSocket
- **Middleware**: X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy, HSTS (prod)
- **Rate limiting**: In-memory (dev), needs Redis (prod)
- **RLS**: All tables have policies (must verify in Supabase Dashboard)
- **Audit logging**: Infrastructure in place (Task #30)

---

## File Locations (Key)

| Purpose | Path |
|---------|------|
| Root layout | `src/app/layout.tsx` |
| Auth context | `src/app/contexts/AuthContext.tsx` |
| Login page | `src/app/login/page.tsx` |
| Signup page | `src/app/signup/page.tsx` |
| Protected pages | `src/app/dashboard/page.tsx`, `src/app/orders/page.tsx`, `src/app/inventory/page.tsx` |
| Dashboard component | `src/components/dashboard/ProductionDashboard.tsx` |
| Layout components | `src/components/layout/Sidebar.tsx`, `Header.tsx`, `UserNav.tsx`, `nav-items.ts` |
| Production components | `src/components/production/ProductionOrderList.tsx`, `ProductionOrderForm.tsx`, `ProductionOrderDetails.tsx` |
| Inventory components | `src/components/inventory/InventoryPanel.tsx` |
| Shared components | `src/components/shared/PageHeader.tsx`, `MetricCard.tsx`, `LoadingSpinner.tsx` |
| Supabase client | `src/lib/supabase/client.ts` |
| Data hooks | `src/lib/hooks/useProductionOrders.ts`, `useInventoryMaterials.ts` |
| Security middleware | `src/middleware.ts` |
| Env validation | `src/lib/env-validation.ts` |
| Supabase schema | `SUPABASE_SCHEMA.sql` |

---

## Environment Variables

**Required:**
```bash
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

**Optional (production recommended):**
```bash
SUPABASE_SERVICE_ROLE_KEY=...  # Server-side admin operations
```

**Validation:** `src/lib/env-validation.ts` (Zod schema) - called from `layout.tsx`

---

## Database Schema (Core Tables)

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `profiles` | User metadata | `id` (FK to auth.users), `role`, `company_name` |
| `production_orders` | Production batches | `user_id`, `block_type`, `quantity_produced`, `status`, `production_date` |
| `inventory_materials` | Raw materials stock | `user_id`, `material_name`, `current_quantity`, `unit_cost` |
| `equipment` | Machinery | `user_id`, `equipment_name`, `model`, `purchase_date` |
| `team_members` | Personnel | `user_id`, `full_name`, `role`, `phone` |

**RLS:** Enabled on all tables. Operators filtered by `user_id`.

---

## Current Tasks / Open Work

| ID | Task | Status |
|-----|------|--------|
| #25 | Rate limiting (in-memory) | ✅ Implemented, ⚠️ needs Redis for prod |
| #27 | Security headers middleware | ✅ Done |
| #28 | Environment validation | ✅ Done |
| #29 | Password strength (zxcvbn) | ✅ Done |
| #30 | Audit logging | ⏳ Incomplete |
| #31 | Dependabot setup | ⏳ Incomplete |
| #32 | Error response sanitization | ⏳ Incomplete |
| #3 | RLS policy verification | ⚠️ Needs manual verification in Supabase |
| ✅ | Desktop sidebar navigation | **Completed** (2026-02-09) |
| ✅ | Standardized protected page layout | **Completed** (Dashboard, Orders, Inventory all follow same pattern) |

---

## Completed Features (Recent)

**Authentication & Dashboard (2026-02-09)**
- Fixed CSP to include Supabase API + WebSocket
- Resolved auth redirect race condition
- Non-blocking AuthContext loading state
- Defensive date handling in dashboard charts
- TypeScript compatibility fixes (Zod v4, zxcvbn, env validation)

**Responsive Navigation (2026-02-09)**
- Desktop sidebar with green gradient theme
- Mobile header with hamburger menu (Sheet)
- Role-based navigation filtering
- Shared nav items constant
- Applied to all protected pages (Dashboard, Orders, Inventory)

**Orders Management Page**
- Full CRUD interface with search & status filters
- Modal dialogs for create/edit/view
- Role-based action permissions (engineers can approve/reject)
- Toast notifications (sonner)
- Uses `useProductionOrders` hook with optimistic updates

**Inventory Page**
- Placeholder panel (to be implemented)
- Follows standard protected page layout

---

**Last Updated:** 2026-02-09

---

## Deployment Notes

### Vercel (Recommended)
- Environment variables in dashboard
- Build command: `npm run build`
- Output: `.next/` (auto-detected)

### Required Post-Deploy
1. Verify RLS policies are active (Supabase Dashboard → Database → Policies)
2. Set `SUPABASE_SERVICE_ROLE_KEY` (for admin server operations)
3. Enable Dependabot in GitHub repo settings
4. Configure custom domain if needed

---

## Quick Start (New Dev)

```bash
# Clone + install
npm ci

# Copy env template
cp .env.local.example .env.local
# Edit .env.local with your Supabase credentials

# Dev server
npm run dev

# Build
npm run build

# Lint
npm run lint
```

---

## Lessons Learned Highlights

See `memory/lessons-learned.md` for full history.

- **Auth race conditions solved** by reactive navigation pattern (no manual waits)
- **CSP must include WebSocket** (`wss://`) for Supabase Realtime
- **Never block loading state** on secondary data (profile fetch)
- **TypeScript compatibility**: Zod v4 uses `.issues` not `.errors`
- **Guarding invalid data** prevents dashboard crashes

---

## Memory File Index

- [Patterns](./patterns.md) - Code conventions and architectural patterns
- [Lessons Learned](./lessons-learned.md) - Mistakes, fixes, insights
- [Decisions](./decisions.md) - Key technical decisions
- [Active Tasks](./active-tasks.md) - Current work in progress
- [Important Files](./important-files.md) - Key file reference
- [Role Separation Analysis](./role-separation-analysis.md) - Security analysis
- [Cybersecurity Compliance](./cybersecurity-compliance.md) - OWASP status
- [Security-First Summary](../SECURITY_FIRST_SUMMARY.md) - Launch criteria
