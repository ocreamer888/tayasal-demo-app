# Dashboard Analytics Issues - Diagnostic

## Check these areas:

### 1. Open Browser Console
Look for:
- JavaScript errors about "undefined" or "cannot read property"
- Recharts errors about missing data or dimensions
- CSS variable warnings

### 2. Verify Data is Loading
Add temporary console logs to ProductionDashboard.tsx:

```typescript
console.log('Orders:', orders.length, orders);
console.log('Production by month data:', productionByMonth);
console.log('Orders by status:', ordersByStatus);
console.log('Production by type:', productionByType);
```

### 3. Check Chart Heights
The `ResponsiveContainer` needs a defined height. Current setup:
- ChartContainer: `min-h-[300px] flex-1`
- CardContent: `flex-1 min-h-0`
- Card: `flex flex-col`

If any parent has `height: 0` or collapses, charts won't render.

**Quick Fix Test:** Add explicit height to CardContent:
```typescript
className="flex-1 w-full px-4 pb-0 min-h-0 h-[300px]"
```

### 4. Verify CSS Variables
Check if these exist in browser dev tools:
- `--chart-1` (should be #10B981 or #34D399 in dark mode)
- `--chart-2` (should be #059669 or #10B981)
- `--chart-3` (should be #EAB308 or #FACC15)

If missing, check:
- `globals.css` is loaded
- Dark mode class is properly set on `<html>`

### 5. Common Issues Specific to This Codebase

**Issue:** Monthly production chart filters out orders without `production_date`
- Check: `productionByMonthRaw` skips orders without valid dates
- If all orders have no production_date, chart will be empty

**Issue:** Operators don't see cost data
- Cost chart data is stripped for operators (line 97-99)
- This is by design

**Issue:** Pie chart shows "No data" if all status counts are 0
- `ordersByStatus` shows all 4 statuses even if count is 0
- Recharts Pie needs at least one value > 0 to render properly

### 6. Database Connection
Verify Supabase is connected and returning data:
- Check network tab for API calls
- Verify production_orders table has data
- Check user authentication and role-based filtering

## Quick Diagnostic Steps:

1. Open app in browser, navigate to Dashboard
2. Open DevTools Console (F12)
3. Run: `document.documentElement.classList.contains('dark')` - should return true or false
4. Check computed CSS for `--chart-1` value
5. Look for any red errors in console
6. Check Network tab for failed API requests
7. Verify data in `orders` state via React DevTools

## Expected Behavior:

All 3 charts should render with:
- **Area Chart**: Monthly production data (6 months)
- **Pie Chart**: Orders by status (4 segments)
- **Bar Chart**: Production by block type

If charts show but are empty, the issue is data-related.
If charts don't appear at all, the issue is CSS/layout related.
