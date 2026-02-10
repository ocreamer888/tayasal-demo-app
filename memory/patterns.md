# Code Patterns & Conventions

This document codifies the architectural and coding patterns used in this codebase to ensure consistency and onboarding efficiency.

---

## Authentication Flow Pattern

**Context:** Next.js App Router + Supabase Auth

**Components:**
- `src/app/contexts/AuthContext.tsx` - Global auth state provider
- Login/Signup pages - API route → `setSession()` → reactive navigation
- Protected pages (Dashboard, etc.) - Redirect if `!user`

**Pattern:**

1. **AuthContext** provides `{ user, profile, loading, signOut, refreshProfile }`
2. **Login/Signup**:
   ```typescript
   const { user } = useAuth();
   useEffect(() => { if (user) router.push('/dashboard'); }, [user]);
   // API call → supabase.auth.setSession()
   ```
3. **Protected Page**:
   ```typescript
   const { user, loading } = useAuth();
   useEffect(() => { if (!loading && !user) router.push('/login'); }, [user, loading]);
   if (loading) return <Spinner />;
   if (!user) return null;
   ```

**Key Principle:** Navigation is a **reaction** to `user` state change, not a separate imperative step after `setSession()`.

---

## Non-Blocking State Updates

**Anti-pattern:**
```typescript
onAuthStateChange(async (event, session) => {
  setLoading(true);
  await fetchProfile(); // Blocks if slow/hanging
  setLoading(false);
});
```

**Pattern:**
```typescript
onAuthStateChange((event, session) => {
  setUser(session?.user ?? null);
  if (session?.user) {
    fetchProfile(session.user.id).catch(err => {
      console.error('Profile fetch failed:', err);
      setProfile(null);
    });
  }
  setLoading(false); // Immediate, profile loads in background
});
```

**Rationale:** Render ASAP. Secondary data can arrive later. Provide fallback (e.g., `user.user_metadata`).

---

## Data Fetching with Use Hooks

**Pattern:** Custom hooks encapsulate data + state + filters + realtime.

**Example:** `useProductionOrders({ userRole })`
- Accepts `userRole` to filter data at query level
- Returns: `orders`, `filteredOrders`, `loading`, `error`, `addOrder`, `updateOrder`, `deleteOrder`, etc.
- Real-time subscription automatically sets up/cleans up
- Optimistic updates with rollback on error

**Usage:**
```typescript
const { orders, loading, addOrder } = useProductionOrders({ userRole });
```

---

## Role-Based Access Control (RBAC)

**Roles:** `operator`, `engineer`, `admin`

**Data Filtering:** In hooks, filter by `user_id` for operators:
```typescript
let query = supabase.from('table').select('*');
if (userRole === 'operator') {
  query = query.eq('user_id', user.id);
}
```

**UI Conditional:** Use `userRole` prop throughout:
```typescript
{(userRole === 'engineer' || userRole === 'admin') && (
  <SecretEngineerComponent />
)}
```

**Fallback:** If `profile?.role` is null, use `user.user_metadata.role` (set during signup).

---

## Defensive Data Processing

**Rule:** Never trust database values. Guard against null/invalid data.

**Pattern - Dates:**
```typescript
if (!order.production_date) return fallback;
const date = new Date(order.production_date);
if (isNaN(date.getTime())) return fallback;
format(date, ...);
```

**Pattern - Numbers:**
```typescript
const value = order.quantity_produced ?? 0;
const total = orders.reduce((sum, o) => sum + (o.total_cost ?? 0), 0);
```

---

## Optimistic Updates with Rollback

**Pattern:** Update UI immediately, then sync with DB. If DB fails, revert.

**Example:**
```typescript
// 1. Save previous state
const previous = orders.find(o => o.id === id);

// 2. Optimistic update
setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o));

// 3. Try DB update
try {
  await supabase.from('...').update(...);
} catch (err) {
  // 4. Rollback on error
  setOrders(prev => prev.map(o => o.id === id ? previous : o));
  throw err;
}
```

---

## Content Security Policy (CSP)

**Location:** `src/middleware.ts`

**Pattern:**
```typescript
response.headers.set(
  'Content-Security-Policy',
  "default-src 'self'; " +
  "connect-src 'self' https://xxx.supabase.co wss://xxx.supabase.co; " +
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
  "style-src 'self' 'unsafe-inline'; " +
  "img-src 'self' data: https:;"
);
```

**Rules:**
- Always include both `https://` and `wss://` for Supabase
- `'unsafe-inline'` and `'unsafe-eval'` for dev convenience (tighten for prod)
- Add other domains as needed (analytics, fonts, etc.)

---

## API Route Pattern (Server-Side Operations)

**Pattern:** Server-side auth + rate limiting + validation.

**Structure:**
```typescript
export async function POST(request: NextRequest) {
  try {
    // 1. Validate input (zod)
    const { email, password } = await request.json();

    // 2. Rate limiting (Upstash Redis in future)
    const ip = request.headers.get('x-forwarded-for') || ...;
    const limit = await checkRateLimit(key, max, window);

    // 3. Server-side operation
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, ...);
    const { data, error } = await supabase.auth.signInWithPassword(...);

    // 4. Return session (client will call setSession)
    return NextResponse.json({ user: data.user, session: data.session });
  } catch (error) {
    return NextResponse.json({ error: '...' }, { status: 500 });
  }
}
```

**Note:** Client must call `supabase.auth.setSession(session)` to establish local auth state.

---

## File Structure Conventions

```
src/
├── app/                    # Next.js App Router pages
│   ├── (auth)/            # Auth pages (login, signup)
│   ├── dashboard/         # Protected pages
│   ├── layout.tsx         # Root layout with Providers
│   └── page.tsx           # Home page (redirects)
├── components/
│   ├── ui/                # shadcn/ui components
│   ├── layout/            # Header, Footer, UserNav
│   ├── dashboard/         # Dashboard-specific components
│   └── shared/            # Reusable components
├── lib/
│   ├── supabase/client.ts # Supabase client singleton
│   ├── hooks/             # Custom data hooks
│   ├── env-validation.ts  # Zod env validation
│   └── utils/              # Utility functions (cn, etc.)
├── middleware.ts          # Security headers (CSP, HSTS, etc.)
└── types/                 # TypeScript interfaces
```

---

## Environment Variable Validation

**Pattern:** Validate on startup in `layout.tsx`:
```typescript
import { validateEnv } from '@/lib/env-validation';
validateEnv(); // Called at module top-level - fails fast if misconfigured
```

**Schema:** Use Zod with helpful error messages:
```typescript
const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().nonempty('...'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, '...'),
});

// Zod v4: result.error.issues vs .errors
```

---

## Security Reminder

- All new features must consider RLS policies
- Never expose more data than needed to the frontend
- Use role-based filtering at query time for operators
- Sanitize error messages (no stack traces in prod)
- CSP must include all external endpoints

---

## Responsive Navigation Pattern

**Structure:**
- Desktop (md+): Fixed left sidebar with full navigation
- Mobile (<md): Top header with hamburger menu (Sheet component)

**Implementation:**

1. **Shared nav items** (`src/components/layout/nav-items.ts`):
   ```typescript
   export const mainNavItems: NavItem[] = [
     { label: "Dashboard", href: "/", icon: BarChart3 },
     { label: "Producción", href: "/production", icon: ClipboardList },
     { label: "Inventario", href: "/inventory", icon: Package },
     { label: "Pedidos", href: "/orders", icon: ShoppingCart },
     { label: "Reportes", href: "/reports", icon: FileText, roles: ['engineer', 'admin'] },
   ];
   ```

2. **Sidebar component** (desktop):
   ```tsx
   <div className="hidden md:flex flex-col h-screen w-64 bg-gradient-to-b from-green-900/20 to-green-800/20 border-r">
     {/* Logo */}
     {/* Navigation links with role filtering */}
     {/* UserNav at bottom */}
   </div>
   ```

3. **Header component** (mobile-only):
   ```tsx
   <header className="md:hidden sticky top-0 ...">
     {/* Logo */}
     {/* Hamburger button */}
     <Sheet> {/* Mobile nav sheet */} </Sheet>
   </header>
   ```

4. **Dashboard layout**:
   ```tsx
   <div className="flex min-h-screen bg-gradient-to-t from-green-900 to-green-800">
     <Sidebar className="hidden md:flex" />
     <div className="flex-1">
       <Header className="md:hidden" />
       <main>...</main>
     </div>
   </div>
   ```

**Key Points:**
- Sidebar and Header both consume `useAuth()` to filter nav items by `userRole`
- Active link highlighting via `usePathname()`
- Consistent green gradient theme across both
- Sidebar uses `overflow-auto` for scrollable navigation if needed

---

## Design System: Green Gradient Theme

**Color palette:** Green spectrum with gradient overlays.

**Background patterns:**
- **Main page backgrounds**: `bg-gradient-to-t from-green-900 to-green-800` (solid, full opacity)
- **Sidebar/panels**: `bg-gradient-to-b from-green-900/20 to-green-800/20` (20% opacity, light tint)
- **Accent**: `from-green-500 to-green-600` for logo and highlights
- **Borders**: `border-green-950` (dark) or `border-white/20` (light on dark)

**Rationale:** Creates visual hierarchy:
- Dark full-gradient = primary page backgrounds
- Light translucent gradient = floating panels/sidebar
- Green accent = brand identity

**Components using this:**
- `DashboardPage` background
- `Sidebar` background
- `Header` mobile sheet background
- `MetricCard` accent bar

---

## shadcn/ui Integration

**Configuration:** `components.json` with:
- `"style": "default"` (New York)
- `"theme": "emerald"` (green color scheme)
- `"iconLibrary": "lucide"`
- `"baseColor": "neutral"`
- `"cssVariables": true`

**Custom components built:**
- `MetricCard` - Premium metric display with gradient accent
- `LoadingSpinner` - Animated spinner
- `Sidebar` - Responsive navigation (new)

**Available shadcn components:** Button, Card, Input, Label, Select, Sheet, ScrollArea (unused), DropdownMenu, Avatar, Badge, Separator, etc.

---

**Last Updated:** 2026-02-09
