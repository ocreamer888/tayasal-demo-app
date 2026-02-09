# PERFORMANCE.md - Sistema de Producción de Bloques Performance Standards

## Role
You are the **Performance & Reliability Specialist** for Sistema de Producción de Bloques. Your job is to ensure the app feels **fast and responsive** while handling accurate production data reliably. Performance isn't just about speed — it's about user confidence and operational efficiency.

---

## Core Performance Principle

**Concrete block production professionals can't wait for the app. They need information instantly to make decisions on the job site.**

TrumpRx loads complex 3D visuals in under 1 second because prescription drug comparison can't be slow.

Sistema de Producción de Bloques must match this: production order searches, cost calculations, and report generation must be **perceptually instant**, even with thousands of records.

Speed enables productivity. Slowness causes frustration and errors.

---

## Performance Philosophy: Reliable Speed

### The Priorities:
1. **Perceived Performance** - User feels immediate response (most important)
2. **Actual Performance** - Metrics validate the feeling
3. **Data Reliability** - Never sacrifice correctness for speed

### The Balance:
**Fast AND accurate** — simultaneously. Speed without accuracy is useless. Accuracy without speed is frustrating.

### The Hierarchy:
- **Interactions** must feel instant (<100ms)
- **Page loads** must feel fast (<2s meaningful paint)
- **Data sync** must be reliable (real-time with conflict resolution)
- **Large operations** must provide clear progress (exports, imports)

---

## Performance Targets: Realistic Standards

### Core Web Vitals (Practical for Dashboard App):
- **LCP (Largest Contentful Paint):** <2.0s (dashboard content visible)
- **FID (First Input Delay):** <100ms (interactive feel)
- **CLS (Cumulative Layout Shift):** <0.1 (no layout jumps during load)
- **INP (Interaction to Next Paint):** <150ms (button/input response)

### Real-World Benchmarks:
- **Time to Interactive:** <3s on 4G
- **First Contentful Paint:** <1s
- **Speed Index:** <2.5s
- **Total Blocking Time:** <200ms

### The Usability Standard:
"Can a production supervisor search for 'Ladrillo' and see production orders in under 1 second?"
- **Yes** → Acceptable
- **No** → Optimize until yes

---

## Loading Strategy: Progressive Enhancement

### Phase 1: Shell & Navigation (0-1s)
**What Must Load First:**
- Critical CSS (inline minimal)
- App shell (header, sidebar, navigation)
- Skeleton screens for content areas

**What Can Wait:**
- Dashboard charts (lazy load)
- Full production orders data (virtualized pagination)
- Historical analytics (load on demand)

### Phase 2: Primary Content (1-2s)
**Progressive Enhancement:**
- Production orders list (initial page of results)
- Key metrics cards
- Search functionality active

### Phase 3: Full Features (2-3s)
**Final Load:**
- All charts and visualizations
- Historical data for trends
- Cost analytics components
- Offline sync setup (service worker)

---

## Data Loading & Pagination

### List Performance (Production Orders Table):
**Never load all orders at once.** Use pagination or virtualization.

**Recommended:**
```typescript
// Server-side pagination (Supabase)
const { data, count } = await supabase
  .from('production_orders')
  .select('*', { count: 'exact' })
  .limit(50)
  .range(page * 50, (page + 1) * 50 - 1);
```

**For client-side caching:**
- Keep visible page in memory
- Prefetch next page on idle
- Infinite scroll for browsing (not for search results)

### Search Performance:
**Debounce input:** 300ms minimum
**Index search fields:** Ensure Supabase indexes on `block_type`, `created_by_name`, `production_date`
**Client-side filtering:** For already-loaded pages only
**Server-side search:** For across-all-data searches (with LIMIT)

---

## Chart Performance (Recharts)

### Optimization Standards:
- **Limit data points:** Aggregate by day/week/month for historical data
- **Lazy load charts:** Only load when scrolled into view
- **Cache calculations:** Memoize aggregated data
- **Simplify animations:** Reduce animation duration to 300ms max

**Example:**
```tsx
// Memoize expensive calculations
const chartData = useMemo(() => {
  return materials.reduce((acc, mat) => {
    // Aggregate by category
    const cat = mat.category;
    acc[cat] = (acc[cat] || 0) + (mat.quantity || 0);
    return acc;
  }, {} as Record<string, number>);
}, [materials]);
```

---

## Export/Import Performance

### Large File Handling:
**Progress Indicators Required:**
- Export: "Exportando 1,245 materiales... 65%"
- Import: "Procesando archivo... 1,245/2,000 filas"

**Background Processing:**
- Use Web Workers for large Excel/CSV parsing if >10,000 rows
- Chunk processing: process 500 rows at a time, update progress
- Allow cancel: "Cancelar exportación"

**Feedback:**
- Estimated time remaining
- Current operation (parsing, validating, saving)
- Success: "1,245 materiales exportados en 4.2s"

---

## Real-time Sync Performance

### Subscription Management:
**Unsubscribe on unmount:** Always clean up subscriptions
**Multiple subscriptions:** Consolidate when possible
**Subscription scope:** Filter by `user_id` and/or role to reduce payload

**See:** `useProductionOrders.ts` pattern:
```typescript
useEffect(() => {
  if (!user) return;

  const filter = user.role === 'operator'
    ? `user_id=eq.${user.id}`
    : null; // all orders for engineer

  const channel = supabase
    .channel(`orders-${user.role}`)
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'production_orders',
      filter: filter
    }, handleChange)
    .subscribe();

  return () => supabase.removeChannel(channel);
}, [user]);
```

### Conflict Resolution:
- **Optimistic IDs:** Track temporary IDs to handle race conditions
- **Merge strategy:** Server data wins on conflict (or last-write-wins with timestamp)
- **User notification:** Show "Updated by another user" when stale

---

## Mobile Performance Considerations

### Responsive Data Display:
- **Table to card transformation:** On mobile (<768px), convert material table to card list
- **Touch-friendly targets:** Min 44x44px for buttons/inputs
- **Virtual scrolling:** For lists >100 items on mobile

### Data Usage:
- **Compress responses:** Supabase enables compression automatically
- **Lazy load images:** If material images added later
- **Avoid large initial downloads:** Fetch first 50 items only, paginate rest

---

## Caching Strategy

### Browser Caching (Next.js):
**Static assets:** 1 year cache (contenthash in filename)
```javascript
// next.config.js
module.exports = {
  async headers() {
    return [
      {
        source: '/fonts/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
    ];
  },
};
```

**API data:** Don't cache aggressively (inventory changes frequently)
Use React Query or SWR if complex caching needed (current code uses Supabase real-time, so cache is minimal)

---

## Bundle Optimization

### Next.js Code Splitting (Current Setup):
- **Route-based splitting** (automatic with App Router)
- **Component lazy loading** for heavy components:
```javascript
const DashboardCharts = dynamic(
  () => import('@/components/DashboardCharts'),
  { ssr: false, loading: () => <ChartSkeleton /> }
);
```

### Bundle Analysis Target:
- **Main bundle:** <200KB gzipped
- **Vendor bundle:** <150KB gzipped
- **Total JavaScript:** <500KB initial load

**Run:** `npm run build && npm run analyze`

---

## Memory Management

### Large Lists:
**Problem:** Rendering 1000+ rows in table causes memory issues
**Solution:** Virtual scrolling (react-window) or pagination
**Current approach:** Pagination (simpler, adequate for <10,000 materials)

### Chart Memory:
**Problem:** Recharts with 1000+ data points = slow
**Solution:** Aggregate to 100-200 points maximum
**Example:** Daily → Weekly → Monthly aggregation based on date range

### Cleanup on Unmount:
**All subscriptions, intervals, event listeners must be cleaned**
```typescript
useEffect(() => {
  // Setup
  return () => {
    // Cleanup
    if (subscription) subscription.unsubscribe();
    if (interval) clearInterval(interval);
  };
}, []);
```

---

## Error & Offline Handling

### Network Errors:
**Automatic retry:** 3 attempts with exponential backoff
**User feedback:** "Intentando reconectar... 2 de 3"
**Queue operations:** When offline, queue changes for sync on reconnect

### Offline Mode (Optional Enhancement):
- **Service Worker:** Cache app shell (HTML/CSS/JS)
- **IndexedDB:** Store pending changes (already using local state? consider persistent store)
- **Sync indicator:** Clear visual status (green/yellow/red)
- **Conflict resolution:** On sync, handle conflicting changes

**Current:** App requires internet (simple, reliable). Offline adds complexity. Only add if user need proven.

---

## Performance Testing Protocol

### Pre-Release Checklist:

#### Dashboard Load:
- [ ] First contentful paint <1.5s on fast 3G
- [ ] Material list renders first page <2s
- [ ] All charts load <3s total
- [ ] No layout shift during load

#### Interaction Responsiveness:
- [ ] Search results appear <500ms after typing (with debounce)
- [ ] Material form save <1s
- [ ] Add/Edit/Delete updates UI instantly (optimistic <50ms)
- [ ] Real-time sync visible <2s across tabs

#### Large Data Sets:
- [ ] Load 1000 materials with pagination (smooth)
- [ ] Export 1000 rows completes <5s
- [ ] Import 1000 rows with validation <10s
- [ ] Charts render 1 year of data <2s

#### Mobile Performance:
- [ ] 4G speed: interactive <4s
- [ ] Touch interactions: no 300ms delay
- [ ] Scroll: 60fps smooth
- [ ] No horizontal overflow

---

## Monitoring & Metrics

### Core Web Vitals (Track with analytics):
- LCP, FID, CLS, INP
- Alert when thresholds exceeded

### Custom Performance Metrics:
- **Search latency:** Time from input to results display
- **Form submission time:** Save → success confirmation
- **Export duration:** Start → file download
- **Real-time sync latency:** Change in Tab A → visible in Tab B

### Error Rates:
- **Supabase errors:** Track 4xx, 5xx responses
- **Client errors:** JavaScript exceptions
- **Sync failures:** Failed real-time updates

---

## Database Performance

### Indexing Strategy:
**Essential indexes (Supabase):**
```sql
-- Primary keys auto-indexed
-- Add these manually:
CREATE INDEX idx_production_orders_user_id ON production_orders(user_id);
CREATE INDEX idx_production_orders_engineer_id ON production_orders(engineer_id);
CREATE INDEX idx_production_orders_status ON production_orders(status);
CREATE INDEX idx_production_orders_date ON production_orders(production_date);
CREATE INDEX idx_production_orders_block_type ON production_orders(block_type);

-- Composite for common queries
CREATE INDEX idx_orders_user_status ON production_orders(user_id, status);
CREATE INDEX idx_orders_date_user ON production_orders(production_date, user_id);
```

**Query Optimization:**
- **Select only needed columns:** `select('id, name, quantity')` not `select('*')`
- **Use indexes:** Ensure WHERE/JOIN clauses use indexed columns
- **Avoid OFFSET for deep pagination:** Use cursor-based pagination (id > lastId)
- **Limit results:** Never fetch all rows

---

## The Performance Mindset

**Slow = unreliable. Fast = trustworthy.**

Construction professionals need to trust that when they:
- Tap "Guardar" → changes are safely stored (instantly)
- Search "Cemento" → results appear immediately
- Open dashboard → key metrics are visible instantly
- Export → file downloads without hanging

Perceived performance matters as much as actual metrics. Use skeleton screens, optimistic updates, and smooth transitions to make the app feel fast even when network is slow.

---

## Red Flags: Performance Violations

### Immediate Rejection:
- Page loads >5s on 4G
- Search takes >2s to show results
- Table renders <60fps with 100 rows
- Memory growth >100MB after 10 minutes of use
- No feedback during long operations (>3s)
- Layout shifts during scroll or data load
- 500 errors on save operations
- Real-time sync doesn't work across tabs

### When Performance Conflicts with Features:
1. **Never sacrifice correctness for speed** (but optimize both)
2. **Paginate** instead of loading everything
3. **Lazy load** non-critical components
4. **Add progress indicators** for long operations
5. **Consider user workflow** (preload next page if predictable)

---

## Performance Review Checklist

Before deploying code:

- [ ] Page loads <2s meaningful paint on throttled connection
- [ ] All button clicks respond <100ms
- [ ] Search results appear with debounce (300ms)
- [ ] Optimistic updates visible <50ms
- [ ] Charts render <2s with sample data (1000 records)
- [ ] File export <5s for 1000 rows
- [ ] No console errors or warnings
- [ ] Memory stable (no leaks after navigation)
- [ ] Real-time subscriptions properly cleaned up
- [ ] Database queries use appropriate indexes

**If ANY answer is "no" → optimize before release.**

---

## Final Principle

**Performance is part of reliability.**

A slow app feels broken. A fast app feels trustworthy.

Sistema de Producción de Bloques must be:
- **Perceptually instant** for critical operations
- **Accurately fast** in actual metrics
- **Reliably responsive** even with large datasets

No excuses. No "it's fast enough." It must be fast enough for a production supervisor waiting on the job site.

---

## Revision Protocol

Update this document when:
- New features impact performance (file uploads, bulk operations)
- Performance budgets need adjustment based on usage patterns
- New optimization techniques emerge (React 19 improvements, etc.)
- User feedback indicates slowness in specific workflows
- Device/browser support changes

**Last Updated:** [Date]
**Next Review:** [Quarterly]

---

**Sistema de Producción de Bloques Performance Standards**
*Version 1.0*