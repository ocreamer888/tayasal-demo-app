# Role Separation: Operator vs Engineer

## ✅ Current Implementation Status

### Data Access (RLS + Hooks)
```
┌─────────────────────────────────────┐
│  Database RLS (Source of Truth)     │
├─────────────────────────────────────┤
│ Operator: WHERE user_id = auth.uid()│ → Sees SOLO sus propias órdenes
│ Engineer: No filter                  │ → Ve TODAS las órdenes
└─────────────────────────────────────┘
```

**Status:** ✅ Correctly implemented in `useProductionOrders.ts` (lines 92-94)

### UI Actions (Component-Level)

| Action | Operator | Engineer | Implementation |
|--------|----------|----------|----------------|
| **View Orders List** | ✅ Own only | ✅ All orders | `useProductionOrders` filter |
| **Create New Order** | ✅ Yes | ✅ Yes | Nueva Orden button visible |
| **Edit Order** | ✅ Own drafts only | ✅ Any order | `canEdit()` function (ProductionOrderList.tsx:102-106) |
| **Delete Order** | ✅ Own drafts | ✅ Any draft | Conditional button (line 271-281) |
| **View Order Details** | ✅ Yes (modal) | ✅ Yes (modal) | Eye button (everyone) |
| **Approve/Reject** | ❌ No | ✅ Yes | Buttons only for engineers (line 233-268) |
| **Submit to Review** | ✅ Own drafts | ✅ Any draft | Button only for engineers (line 257-267) |
| **Export Data** | ❌ No | ✅ Yes | Phase 7 (not implemented yet) |

**Status:** ✅ Mostly correct. See "🚨 CRITICAL ISSUES" below.

---

## 🚨 CRITICAL ISSUES: Cost Visibility

### Violation of Security Requirement

**Specification (project-context.md lines 86-91):**
> Operator (Personal Operativo)
> - Create new production orders
> - Edit own orders (only while status = 'draft')
> - View own orders list
> - View order details
> - View inventory (read-only)
> - **Cannot:** See others' orders, **view costs**, access admin dashboard

**Operators CANNOT view costs.** Currently they CAN see costs in two places:

### Issue #1: Cost Column in Orders List

**File:** `components/production/ProductionOrderList.tsx:208-210`

```tsx
<TableCell className="font-semibold tabular-nums text-neutral-900">
  {formatCurrency(order.total_cost)}  // ← Visible to everyone
</TableCell>
```

**Current:** Operators see total_cost in the table.

**Fix:** Hide entire column OR mask it for operators:
```tsx
{userRole === 'engineer' || userRole === 'admin' ? (
  <TableCell>...cost...</TableCell>
) : (
  <TableCell>-</TableCell>
)}
```

---

### Issue #2: Full Cost Breakdown in Details Modal

**File:** `components/production/ProductionOrderDetails.tsx:283-315`

The modal shows:
- Materiales: $X
- Mano de Obra: $X
- Equipos: $X
- Energía: $X
- Mantenimiento: $X
- **Costo Total: $X**

**Current:** Anyone who clicks "View Details" sees all costs.

**Fix:** Conditionally hide cost sections for operators:
```tsx
{(userRole === 'engineer' || userRole === 'admin') && (
  <Card>Desglose de Costos</Card>
)}
```

---

### Issue #3: Dashboard Shows Cost Charts to Everyone

**File:** `components/dashboard/ProductionDashboard.tsx:107-129`

The dashboard shows:
- "Costo Promedio" KPI card (line 118-122)
- Production charts with cost data (lines 171-175)

**Current:** Operators see cost analytics.

**Fix:** Conditionally render cost-related cards based on role:
```tsx
{userRole === 'engineer' || userRole === 'admin' ? (
  <MetricCard title="Costo Promedio" ... />
) : null}
```

Also check if area chart lines 171-175 include cost data - currently only quantity, but verify no cost data is exposed.

---

## 🎯 Role Separation Matrix

### What Operators Should See:
- ✅ Dashboard: Simple KPIs (total orders, blocks produced, pending approvals)
- ❌ Dashboard: NO cost metrics, NO cost charts
- ✅ Orders List: Their orders only, NO cost column
- ✅ Order Details: Production specs, materials (quantities only), team, equipment, notes
- ❌ Order Details: NO costs, NO cost breakdown
- ✅ Inventory: Read-only view (if implemented)
- ❌ Navigation: No "Export", "Admin", "Settings" links
- ❌ Actions: NO approve/reject buttons

### What Engineers Should See:
- ✅ Dashboard: ALL metrics including cost analysis, production trends
- ✅ Orders List: ALL orders (all operators) with cost column
- ✅ Order Details: Full cost breakdown (materials, labor, equipment, energy, maintenance, total)
- ✅ Inventory: Full CRUD (if implemented)
- ✅ Navigation: All links
- ✅ Actions: Approve, reject, submit orders

---

## 🔐 Multi-Layer Security Architecture

```
┌─────────────────────────────────────────────┐
│  1. Navigation Layer                       │
│     Hide forbidden links in Header.tsx     │
│     (Operators don't see "Reportes", etc)  │
├─────────────────────────────────────────────┤
│  2. Page Layer                             │
│     Dashboard: Conditional rendering       │
│     of cost-specific components            │
├─────────────────────────────────────────────┤
│  3. Component Layer                        │
│     ProductionOrderList: Hide cost column  │
│     ProductionOrderDetails: Hide cost      │
│     sections for operators                 │
├─────────────────────────────────────────────┤
│  4. Hook Layer                             │
│     useProductionOrders: Filter by user_id │
│     (operators only own data)              │
├─────────────────────────────────────────────────┐
│  5. Database Layer (RLS)                    │
│     Enforces: WHERE user_id = auth.uid()    │
│     for operators (cannot be bypassed)      │
│     This is the SOURCE OF TRUTH             │
└─────────────────────────────────────────────────┘
```

**Defense in Depth:** 5 layers prevent unauthorized access. If UI bug occurs, RSL still blocks data.

---

## ✅ Current Separation Strengths

1. **Data filtering** via `userRole` in hooks works correctly
2. **Action restrictions** (approve/reject) implemented properly
3. **Edit permissions** correctly differentiated (operators: own drafts only; engineers: any)
4. **RLS** provides ultimate protection (if properly configured)

---

## ❌ Missing Separations (Action Required)

1. **Cost visibility** - biggest gap
2. **Dashboard role-specific content** - need to hide cost metrics from operators
3. **Inventory management** - should operators even see inventory panel? Spec says "View inventory (read-only)" ✅, but should they NOT see stock levels? Probably yes, read-only is fine.

---

## 📋 Recommended Fixes Priority

### 🔴 CRITICAL (Security)
1. Hide cost column in `ProductionOrderList.tsx` for operators
2. Hide cost breakdown in `ProductionOrderDetails.tsx` for operators
3. Hide cost metrics in `ProductionDashboard.tsx` for operators

### 🟡 IMPORTANT (UX)
4. Consider hiding entire charts section from operators (only show productivity charts without cost data)
5. Add role-based navigation in Header (if we add engineer-only pages later)

### 🟢 NICE TO HAVE
6. Create专门的组件如 `<CostCard role={userRole} ... />` to centralize cost visibility logic
7. Add tests verifying operators cannot see cost data

---

## Questions for You:

1. **Should operators see ANY costs at all?** (Answer: No per spec)
2. **Should operators see productivity charts?** Yes (blocks produced, orders by status) but NOT cost charts.
3. **Should inventory page be role-differentiated?** Currently operators can see inventory. Should they also be able to see adjustments history? Spec says "read-only" so maybe they should NOT see "adjust stock" buttons.

---

**Bottom Line:** The separation is 80% there, but cost visibility is a **security gap** that must be fixed before launch. Cost data is considered sensitive (profit margins, efficiency metrics) and operators should not see it.
