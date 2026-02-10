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
   <div className="hidden md:flex flex-col h-[98vh] w-64 bg-gradient-to-b from-green-900/20 to-green-800/20 m-4 border-r border-white/20 rounded-r-2xl">
     {/* Logo */}
     {/* Navigation links with role filtering */}
     {/* UserNav at bottom */}
   </div>
   ```

3. **Header component** (mobile-only):
   ```tsx
   <header className="md:hidden sticky top-0 z-100 flex h-16 items-center justify-between px-6 bg-green-900/80 backdrop-blur-sm">
     {/* Logo */}
     {/* Hamburger button */}
     <Sheet> {/* Mobile nav sheet with same nav items */} </Sheet>
   </header>
   ```

4. **Protected Page Layout** (Dashboard, Orders, Inventory, etc.):
   ```tsx
   export default function Page() {
     const { user, profile, loading } = useAuth();
     const userRole = (profile?.role || user?.user_metadata?.role) as 'operator' | 'engineer' | 'admin' || 'operator';

     // Auth guard
     useEffect(() => { if (!loading && !user) router.push('/login'); }, [user, loading]);

     if (loading) return <LoadingSpinner />;
     if (!user) return null;

     return (
       <div className="min-h-screen bg-gradient-to-t from-green-900 to-green-800 flex">
         <Sidebar className="hidden md:flex" />
         <div className="flex-1 flex flex-col min-h-screen">
           <Header className="md:hidden" />
           <main className="flex-1 mx-auto max-w-7xl px-4 py-8 overflow-y-auto">
             <PageHeader title="..." description="..." icon={Icon} />
             {/* Page content */}
           </main>
         </div>
       </div>
     );
   }
   ```

**Key Points:**
- Sidebar and Header both consume `useAuth()` to filter nav items by `userRole`
- Active link highlighting via `usePathname()`
- Consistent green gradient theme across both
- Main content area uses `overflow-y-auto` for scrollable content
- User role derived from `profile?.role` with fallback to `user.user_metadata.role`

---

## Page Layout Composition Pattern

**Standard page structure for all protected routes:**

```typescript
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/contexts/AuthContext';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { PageHeader } from '@/components/shared/PageHeader';
import { SomeIcon } from 'lucide-react';

export default function PageName() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();
  const userRole = (profile?.role || user?.user_metadata?.role) as 'operator' | 'engineer' | 'admin' || 'operator';

  // Authentication guard
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-50">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-t from-green-900 to-green-800 flex">
      <Sidebar className="hidden md:flex" />
      <div className="flex-1 flex flex-col min-h-screen">
        <Header className="md:hidden" />
        <main className="flex-1 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 overflow-y-auto">
          <PageHeader
            title="Page Title"
            description="Description"
            icon={SomeIcon}
            actions={<Button>Action</Button>} // optional
          />
          {/* Page-specific content */}
        </main>
      </div>
    </div>
  );
}
```

**Notes:**
- Loading state: centered spinner on neutral background
- Authenticated layout: green gradient background with sidebar/header
- `overflow-y-auto` on main allows independent scrolling
- PageHeader supports optional `actions` prop for buttons (e.g., "Create New")

---

## Toast Notification Pattern

**Library:** `sonner`

**Usage:**
```typescript
import { toast } from 'sonner';

// Success
toast.success('Orden creada exitosamente');

// Error
toast.error(
  error instanceof Error ? error.message : 'Error al eliminar la orden'
);

// Loading toast
const toastId = toast.loading('Processing...');
toast.success('Done!', { id: toastId });
```

**Placement:** Global `Toaster` component in `src/app/layout.tsx`:
```tsx
<Toaster position="top-right" richColors />
```

---

## Form Handling Pattern

**State management:** Local `useState` for form fields.

**Validation:** Client-side with Zod (via `@hookform/resolvers` + `react-hook-form`).

**Submission:**
```typescript
const handleSubmit = async (formData: any) => {
  try {
    await mutation.mutateAsync(formData);
    toast.success('Success message');
    resetForm();
  } catch (error) {
    toast.error('Error message');
  }
};
```

**Modal dialogs:** Controlled via state (`showForm`, `editingOrder`).

---

**Last Updated:** 2026-02-09
