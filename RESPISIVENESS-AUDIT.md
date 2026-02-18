Responsiveness Audit Report

  Summary

  The project has a mixed responsiveness implementation. While the overall layout structure correctly implements mobile-first patterns (sidebar hidden on mobile,
  hamburger menu, responsive grids), there are several critical issues that cause horizontal overflow and poor mobile experience.

  ---
  Critical Issues (Must Fix)

  1. Fixed Minimum Width Constraints Cause Horizontal Scroll

  Files affected:
  - src/app/orders/page.tsx:126 - min-w-5xl (1024px minimum width)
  - src/app/reports/page.tsx:61 - min-w-5xl (1024px minimum width)

  Problem: These containers force a minimum width of 1024px, causing horizontal scrolling on all mobile devices and tablets in portrait mode.

  // orders/page.tsx - line 126
  <main className="flex-1 mx-auto min-w-5xl max-w-9xl px-4 py-8 max-h-screen overflow-y-auto">
  //                    ^^^^^^^^^^ Forces 1024px minimum

  2. Tables Use whitespace-nowrap Preventing Content Wrapping

  Files affected:
  - src/components/ui/table.tsx:73 - TableHead uses whitespace-nowrap
  - src/components/ui/table.tsx:86 - TableCell uses whitespace-nowrap
  - src/components/production/ProductionOrderList.tsx - inherits these styles

  Problem: Table cells cannot wrap content, forcing tables to overflow their containers on narrow screens.

  // table.tsx:73
  <th className="... whitespace-nowrap [&:has([role=checkbox])]:pr-0 ...">

  // table.tsx:86
  <td className="... whitespace-nowrap text-neutral-700 ...">

  3. ReportGenerator Uses Excessive Width Constraints

  File: src/components/reports/ReportGenerator.tsx:117-128

  Problem: Multiple nested max-w-[90vw] containers with redundant width specifications may cause overflow calculations to compound.

  ---
  Moderate Issues (Should Fix)

  4. Charts Have Fixed Dimensions

  File: src/components/dashboard/ProductionDashboard.tsx:208

  Problem: Pie chart uses fixed outerRadius={80} which may be too large on small screens (320px-375px wide phones).

  <Pie outerRadius={80} ... />

  5. Form Dynamic Row Layouts Not Responsive

  File: src/components/production/ProductionOrderForm.tsx:481-550

  Problem: Material/equipment/team rows use flex with fixed-width children (w-24, w-32, w-20) that don't adapt to small screens:

  <div className="flex items-center gap-4 p-4 bg-neutral-50 rounded-lg">
    <div className="flex-1 ...">...</div>
    <div className="w-24 ...">...</div>  {/* Fixed width */}
    <div className="w-20 ...">...</div>  {/* Fixed width */}
    <Button className="mt-6">...</Button>
  </div>

  6. Dashboard Recent Orders Table Not Using Table Component

  File: src/components/dashboard/ProductionDashboard.tsx:314-372

  Problem: Uses a raw <table> instead of the styled Table component, lacking overflow-x-auto wrapper.

  ---
  Minor Issues (Nice to Fix)

  7. Dialog Content Centering May Be Off-Center on Mobile

  File: src/components/ui/dialog.tsx:64

  The dialog uses left-[50%] with translate-x-[-50%] which works, but max-w-[90vw] combined with padding may cause slight overflow on very small screens.

  8. Inconsistent Main Container Patterns

  Files: Various page.tsx files

  Different pages use different max-width patterns:
  - dashboard: max-w-9xl only
  - orders: min-w-5xl max-w-9xl (problematic)
  - reports: min-w-5xl max-w-9xl (problematic)
  - inventory: max-w-7xl only

  ---
  Positive Findings (What's Working Well)

  1. Navigation Pattern ✅
    - Mobile header correctly hidden on desktop (md:hidden)
    - Sidebar correctly hidden on mobile (hidden md:flex)
    - Sheet component for mobile navigation works well
  2. Grid Layouts ✅
    - Most pages use proper responsive grids (grid-cols-1 md:grid-cols-2 lg:grid-cols-3)
  3. Charts Wrapper ✅
    - ChartContainer uses ResponsiveContainer from recharts
    - Proper min-h-[300px] and flexbox layout
  4. Dialog & Sheet Components ✅
    - Sheet uses responsive width (w-3/4 sm:max-w-sm)
    - Dialog uses max-w-[90vw] (though could be improved)

  ---
  Recommendations by Priority

  Immediate (Blocking Mobile Usage)

  1. Remove min-w-5xl from orders/page.tsx and reports/page.tsx
  2. Add overflow-x-auto wrapper to the Dashboard's recent orders table
  3. Remove whitespace-nowrap from TableCell or make it conditional (sm:whitespace-nowrap)

  Short-term (Improving Mobile UX)

  4. Make material/equipment/team form rows stack vertically on mobile (flex-col vs flex-row)
  5. Reduce Pie chart outerRadius to be responsive (use 60 for mobile, 80 for desktop)
  6. Add horizontal scroll indicators for tables on mobile

  Long-term (Polish)

  7. Standardize container max-widths across all pages
  8. Test on actual device sizes (320px iPhone SE, 375px iPhone 12/13/14)
  9. Consider card-based layouts instead of tables for mobile views

  ---
  Quick Wins Code Examples

  Fix 1: Remove min-width constraint
  // Before
  <main className="flex-1 mx-auto min-w-5xl max-w-9xl px-4 py-8">

  // After
  <main className="flex-1 mx-auto w-full max-w-9xl px-4 py-8">

  Fix 2: Make table cells wrap on mobile
  // In table.tsx - make whitespace-nowrap conditional
  <td className={cn(
    "px-6 py-4 align-middle text-neutral-700 [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
    "whitespace-normal sm:whitespace-nowrap",  // Wrap on mobile, nowrap on desktop
    className
  ))} />

  Fix 3: Make form rows responsive
  // In ProductionOrderForm - material rows
  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 bg-neutral-50 rounded-lg">
    {/* Fields now stack on mobile */}
  </div>