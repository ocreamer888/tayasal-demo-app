# ReportGenerator Implementation - Detailed Task List

**Created:** 2026-02-17
**Status:** Ready for Implementation
**Total Estimate:** 22 hours (full) / 8 hours (MVP)

---

## 📋 Phase 1: Data Types & Aggregation Layer (4 hours)

### Task 1.1: Create Type Definitions ✅ COMPLETED
**File:** `src/types/reports.ts` (created)
**Completed:** 2026-02-17

- [x] Create `CycleType` union: `'daily' | 'weekly' | 'monthly' | 'custom'`
- [x] Create `ExportFormat` union: `'excel' | 'pdf' | 'both'`
- [x] Create `ReportSections` interface for toggles
- [x] Create `ReportConfig` interface with all properties
- [x] Create `ReportSummary` interface with metrics (totalOrders, totalBlocks, totalCost, avgCostPerBlock, blocksPerHour, topBlockType)
- [x] Create `CostsByCategory` interface (materials, labor, equipment, energy, maintenance)
- [x] Create `InventorySnapshot` interface for inventory changes
- [x] Create `ReportData` interface aggregating all data
- [x] Create `DateRange` interface: `{ start: Date; end: Date }`
- [x] Create component props interfaces (ReportFormProps, ReportPreviewProps, ReportGeneratorProps)
- [x] Create utility types (ReportGenerationStatus, ReportError, ReportProgress)
- [x] Export from `src/types/index.ts`

### Task 1.2: Create Date Template Utilities ✅ COMPLETED
**File:** `src/lib/utils/report-templates.ts`
**Completed:** 2026-02-17

- [x] Import date-fns functions (startOfDay, endOfDay, startOfWeek, etc.)
- [x] Create `getDateRangeForCycle(cycle, referenceDate)` function
- [x] Implement `getTodayRange()` - returns start/end of today
- [x] Implement `getCurrentWeekRange()` - ISO week (Monday-Sunday)
- [x] Implement `getCurrentMonthRange()` - first day to last day
- [x] Implement `getCustomRange(startDate, endDate)` - validates range
- [x] Add JSDoc comments for all functions
- [x] Export all functions

### Task 1.3: Create Data Aggregator ✅ COMPLETED
**File:** `src/lib/utils/report-data-aggregator.ts`
**Completed:** 2026-02-17

- [x] Import types from reports.ts
- [x] Create `filterOrdersByDate(orders, startDate, endDate)`:
  - Filter orders where created_at is within range
  - Handle timezone (use UTC midnight)
- [x] Create `calculateSummary(orders)`:
  - totalOrders: count
  - totalBlocks: sum of block_quantity
  - totalCost: sum of total_cost
  - avgCostPerBlock: totalCost / totalBlocks
  - blocksPerHour: calculate from actual_time (duration_minutes)
  - topBlockType: most frequent block_type
- [x] Create `aggregateCosts(orders)`:
  - materials: sum of materials_cost
  - labor: sum of labor_cost
  - equipment: sum of equipment_cost
  - energy: sum of energy_cost
  - maintenance: sum of maintenance_cost
- [x] Create `calculateInventoryChanges(orders, materials)`:
  - Calculate consumption per material from orders.materials_used
  - Return inventory snapshots with before/after based on current inventory
- [x] Create main `aggregateReportData(config)` function
- [x] Add error handling for edge cases (no orders, division by zero)
- [x] Added helper functions: formatCurrencyCLP, formatDateES, getProductionDate

### Task 1.4: Test Aggregation Logic ✅ COMPLETED
**Completed:** 2026-02-17

- [x] Created comprehensive test file: `src/lib/__tests__/report-data-aggregator.test.ts`
- [x] Created test data factory functions for orders and inventory materials
- [x] Test date filtering with various ranges (3 tests)
- [x] Verify summary calculations are accurate (6 tests including edge cases)
- [x] Verify cost aggregation matches expected totals (2 tests)
- [x] Test inventory consumption calculations (3 tests)
- [x] Test full report aggregation (4 tests)
- [x] Test currency and date formatting (2 tests)
- [x] All 20 tests passing ✅

---

## 📋 Phase 2: Excel Exporter (4 hours)

### Task 2.1: Verify xlsx Library Capabilities ✅ COMPLETED
**Completed:** 2026-02-17

- [x] Installed `xlsx-js-style` package (provides cell styling support)
- [x] Decision: Use `xlsx-js-style` for professional Excel styling
- [x] Verified documentation supports: colors, fonts, borders, column widths, fills

### Task 2.2: Create Excel Workbook Builder ✅ COMPLETED
**File:** `src/lib/utils/excel-exporter.ts`
**Completed:** 2026-02-17

- [x] Created complete workbook builder with styled sheets
- [x] Created style constants: GREEN_HEADER, DARK_GREEN_HEADER, ALTERNATE_ROW, BORDER_STYLE, TOTAL_ROW
- [x] Implemented `buildSummarySheet()`: "Resumen" sheet with metrics table
- [x] Implemented `buildOrdersSheet()`: "Órdenes" sheet with 10 columns, dark green headers, alternating rows
- [x] Implemented `buildCostsSheet()`: "Costos" sheet with categories and percentages, total row with double border
- [x] Implemented `buildInventorySheet()`: "Inventario" sheet with conditional rendering
- [x] Created helper functions: `formatCurrencyCLP`, `formatDateES` (using date-fns)
- [x] Applied full borders to all cells
- [x] Set appropriate column widths for each sheet
- [x] Used Tailwind green palette (#15803d, #14532d, #ecfccb, #f9fafb)

### Task 2.3: Add Excel Export Function ✅ COMPLETED
**File:** `src/lib/utils/excel-exporter.ts` (continued)
**Completed:** 2026-02-17

- [x] Created `exportToExcel(reportData)` main function
- [x] Creates workbook, builds all required sheets
- [x] Generates filename: `Tayasal_Produccion_YYYYMMDD_ciclo_YYYY-MM.xlsx`
- [x] Writes workbook to binary blob
- [x] Implemented `downloadFile(blob, filename)` helper
- [x] Implemented `s2ab()` string-to-ArrayBuffer converter
- [x] Full export flow triggers download automatically

### Task 2.4: Test Excel Export ⏳ PENDING
**Manual testing required**

- [ ] Generate test report with sample data
- [ ] Download file and open in Excel
- [ ] Verify all sheets present (Resumen, Órdenes, Costos, Inventario)
- [ ] Verify styling applied (headers green, alternating rows)
- [ ] Verify column widths reasonable
- [ ] Verify currency format CLP (e.g., $1.500.000)
- [ ] Verify date format DD/MM/YYYY
- [ ] Open in LibreOffice (compatibility check)
- [ ] Verify file size < 5MB for typical usage

---

## 📋 Phase 3: PDF Exporter (4 hours)

### Task 3.1: Install PDF Dependencies ✅ COMPLETED
**Completed:** 2026-02-17

- [x] Installed `jspdf` and `jspdf-autotable`
- [x] Verified TypeScript types available (via @types/jspdf and autoTable)
- [x] Dependencies added to package.json

### Task 3.2: Create PDF Cover Page Builder ✅ COMPLETED
**File:** `src/lib/utils/pdf-exporter.ts`
**Completed:** 2026-02-17

- [x] Created `addCoverPage(doc, reportData)` function
- [x] Title: "Tayasal - Informe de Producción" (green, bold, centered)
- [x] Period text: start - end dates in DD/MM/YYYY
- [x] Generation date
- [x] Horizontal green line (#15803d)
- [x] "CONFIDENCIAL" label at bottom

### Task 3.3: Create PDF Table Builders ✅ COMPLETED
**File:** `src/lib/utils/pdf-exporter.ts` (continued)
**Completed:** 2026-02-17

- [x] Created `addExecutiveSummary(doc, data)`:
  - 6 key metrics displayed in 2-column grid
  - Labels in gray, values in dark green bold
- [x] Created `addOrdersTable(doc, data)`:
  - 9 columns (ID, Fecha, Tipo, Cant., Costs, Operario)
  - Dark green header row
  - Alternating row colors (gray-50)
  - Total column in bold green
  - Auto page breaks enabled
- [x] Created `addCostsTable(doc, data)`:
  - 3 columns (Categoría, Monto, %)
  - Cost categories: Materiales, Mano de Obra, Equipo, Energía, Mantenimiento
  - TOTAL row in green fill with white text, double border
- [x] Created `addInventoryTable(doc, data)`:
  - 7 columns (Material, Unidad, Stocks, Costos, Valor)
  - Only rendered if inventoryChanges present
  - Alternating rows, numeric formatting

### Task 3.4: Add PDF Export Function ✅ COMPLETED
**File:** `src/lib/utils/pdf-exporter.ts` (continued)
**Completed:** 2026-02-17

- [x] Created `exportToPDF(reportData)` main function
- [x] Landscape orientation, A4 size
- [x] Sequential page building (cover → summary → orders → costs → inventory)
- [x] Footer added to all pages via `addFooterToAllPages()`
- [x] Footer includes: bottom gray line, "CONFIDENCIAL", "Página X de Y"
- [x] Filename: `Tayasal_Produccion_YYYYMMDD_ciclo_YYYY-MM.pdf`
- [x] Auto-download via `doc.save()`

### Task 3.5: Test PDF Export ⏳ PENDING
**Manual testing required**

- [ ] Generate test PDF with 100+ orders
- [ ] Verify cover page displays correctly
- [ ] Verify tables span multiple pages with headers repeated
- [ ] Check page breaks don't cut rows (autoTable should handle)
- [ ] Verify page numbers in footer (X de Y)
- [ ] Verify "CONFIDENCIAL" text visible on every page
- [ ] Check file size < 1MB for 100+ orders
- [ ] Test with 500+ rows (performance check)
- [ ] Open in Adobe Reader, Preview, and browser PDF viewer

---

## 📋 Phase 4: ReportGenerator UI Components (6 hours)

### Task 4.1: Create ReportForm Component ✅ COMPLETED
**File:** `src/components/reports/ReportForm.tsx`
**Completed:** 2026-02-17

- [x] Created controlled form with useState for cycle, dates, sections, format
- [x] Cycle type RadioGroup: Daily, Weekly, Monthly, Custom
- [x] Conditional date inputs:
  - Daily: single date picker (auto-preset via bit)
  - Weekly/Monthly: single date picker (computes range)
  - Custom: start + end date pickers
- [x] Checkboxes for sections: Resumen, Órdenes, Costos, Inventario
- [x] Format selection: Excel, PDF, Ambas
- [x] Dual action buttons: "Vista Previa" and "Exportar"
- [x] Validation: at least one section, valid date range
- [x] Error display and loading state
- [x] Responsive layout using Tailwind grid

### Task 4.2: Create ReportPreview Component ✅ COMPLETED
**File:** `src/components/reports/ReportPreview.tsx`
**Completed:** 2026-02-17

- [x] Dialog modal using shadcn Dialog
- [x] Summary cards: total orders, blocks, total cost, avg cost/block
- [x] Orders preview table: first 50 rows, sticky header
- [x] Table shows orders with costs and operator name
- [x] "Cerrar" and "Exportar" buttons
- [x] Loading state support
- [x] Responsive scrollable table container

### Task 4.3: Create ReportGenerator Main Component ✅ COMPLETED
**File:** `src/components/reports/ReportGenerator.tsx`
**Completed:** 2026-02-17

- [x] Used useProductionOrders and useInventoryMaterials hooks with role filtering
- [x] State: showPreview, reportData, previewConfig, isGenerating, error
- [x] handlePreview: aggregates data, opens modal
- [x] handleExport: aggregates and calls exporter(s) based on format
- [x] Integrated toast notifications (sonner) for success/error
- [x] Loading handling while data fetches
- [x] Renders Card with title, description, ReportForm, and ReportPreview

### Task 4.4: Style Components ✅ COMPLETED
**Files:** All components in `src/components/reports/`

- [x] Consistent spacing using Tailwind space-y and gap-*
- [x] Used shadcn Card, Button, Checkbox, RadioGroup, Dialog, Table
- [x] Green theme (#15803d) for buttons and highlights
- [x] Responsive layouts (flex, grid) for mobile and desktop
- [x] Spanish labels throughout UI
- [x] Accessibility: proper labels, focus states from shadcn


---

## 📋 Phase 5: Reports Page & Navigation (4 hours)

### Task 5.1: Create Reports Page ✅ COMPLETED
**File:** `src/app/reports/page.tsx`
**Completed:** 2026-02-17

- [x] Created client page with route guard (useEffect + router.replace)
- [x] Auth check: only engineers and admins allowed
- [x] Redirect non-authorized users to /dashboard
- [x] Loading spinner while auth state determines
- [x] Layout: breadcrumb, title "Reportes de Producción", description
- [x] Renders ReportGenerator component
- [x] Max-width container with responsive padding

### Task 5.2: Update Navigation ✅ COMPLETED (PRE-EXISTING)
**File:** `src/components/layout/nav-items.ts`
**Status:** Already implemented

- [x] Navigation item exists with label "Reportes"
- [x] Href: "/reports"
- [x] Icon: FileText
- [x] Roles restricted to ['engineer', 'admin']
- [x] Navigation automatically shows/hides based on user role

### Task 5.3: Add Route Protection ✅ COMPLETED
**Implementation:** Page-level guard in page.tsx

- [x] useEffect checks profile.role after auth loading
- [x] Redirects operators to /dashboard
- [x] Redirects unauthenticated to /login
- [x] Engineers and admins see page normally
- [x] No server middleware needed (client-side guard sufficient)

### Task 5.4: Test Page Integration ⏳ PENDING
**Requires manual testing**

- [ ] Load /reports page as engineer (should render form)
- [ ] Verify ReportGenerator renders without errors
- [ ] Test form interactions (change cycle, dates, sections)
- [ ] Generate preview and verify modal opens
- [ ] Test Excel export and verify file downloads
- [ ] Test PDF export and verify file downloads
- [ ] Verify file contents match selected sections
- [ ] Test with real production data in database


---

## 📋 Phase 6: Testing & Polish (4 hours)

### Task 6.1: Functional Testing ⏳ PENDING
**Requires manual testing**

- [ ] Test daily report with today's orders
- [ ] Test weekly report with current week
- [ ] Test monthly report with current month
- [ ] Test custom date range
- [ ] Test with no orders in range (should show "0" gracefully)
- [ ] Test all sections toggle on/off
- [ ] Test Excel export → verify file downloads and opens
- [ ] Test PDF export → verify file downloads and opens
- [ ] Test "Ambas" format (both files)
- [ ] Verify no crashes or console errors

### Task 6.2: Data Accuracy Testing ⏳ PENDING
**Requires manual verification**

- [ ] Compare order counts with Orders page reports (match)
- [ ] Verify sum of order totals equals report total cost
- [ ] Check inventory consumption matches materials used in orders
- [ ] Verify currency format uses CLP (e.g., $1.500.000)
- [ ] Verify date format is DD/MM/YYYY everywhere
- [ ] Test with 50+ orders (performance)
- [ ] Test with 100+ orders

### Task 6.3: Performance Testing ⏳ PENDING
**Requires benchmarking**

- [ ] Measure aggregation time for 100 orders (target < 1s)
- [ ] Measure aggregation time for 500 orders (target < 2s)
- [ ] Measure Excel export time (target < 3s for 500 orders)
- [ ] Measure PDF export time (target < 5s for 500 orders)
- [ ] Ensure < 5 seconds for Excel (< 1000 orders)
- [ ] Ensure < 8 seconds for PDF (< 1000 orders)
- [ ] Verify loading indicators appear during export

### Task 6.4: Professional Appearance Testing ⏳ PENDING
**Requires manual inspection in Excel/PDF**

**Excel:**
- [ ] Header rows: dark green (#15803d), white bold text
- [ ] Alternating rows: white / #f9fafb
- [ ] All cells have visible borders
- [ ] Column widths are appropriately auto-sized (no truncation)
- [ ] Sheet names: "Resumen", "Órdenes", "Costos", "Inventario"
- [ ] Opens in Microsoft Excel without format warnings
- [ ] Opens in LibreOffice Calc correctly

**PDF:**
- [ ] Cover page centered, green title, horizontal line, "CONFIDENCIAL"
- [ ] Tables don't cut rows across page breaks (autoTable should handle)
- [ ] Page numbers appear in footer on all pages ("Página X de Y")
- [ ] Tables repeat headers on each page
- [ ] Text readable (font size > 8pt, good contrast)
- [ ] File size reasonable (< 500KB for 100 orders)

### Task 6.5: Edge Case Testing ⏳ PENDING
**Requires manual test cases**

- [ ] Test 1-year date range ( Jan 1 - Dec 31 )
- [ ] Test very long material names (ensure display/truncation)
- [ ] Test orders with null/empty optional fields (display as "-" or "N/A")
- [ ] Test numeric overflow (costs > 1 billion CLP)
- [ ] Test with special characters in block_type or operator names
- [ ] Test export while offline (error toast should appear)

### Task 6.6: UX Improvements ⏳ PENDING
**Polish enhancements**

- [ ] Add filename to success toast after export
- [ ] Disable export button while generating (already implemented via isLoading)
- [ ] Show progress indicator (e.g., "Procesando X órdenes..." ) - optional
- [ ] Ensure error messages are user-friendly (not raw stack traces)
- [ ] Add help text or tooltips explaining each section option
- [ ] Add confirmation dialog before export with large date ranges (> 6 months)

---

## ✅ Automated Tests Implemented

**Unit Tests:** `src/lib/__tests__/report-data-aggregator.test.ts`
- 20 comprehensive tests covering filtering, summary, costs, inventory, formatting
- All tests passing ✅

**Manual Testing Required:** Excel/PDF export styling, UI integration, performance with large datasets


---

## 📋 MVP Checklist (8 hours)

If building MVP first, complete these tasks only:

**Phase 1:** Tasks 1.1, 1.3 (skip 1.2 presets, skip 1.4 tests)
**Phase 2:** Tasks 2.2 (orders sheet only), 2.3, 2.4
**Phase 3:** Skip entirely (no PDF)
**Phase 4:** Tasks 4.1 (custom range only), 4.3 (no preview)
**Phase 5:** Tasks 5.1, 5.2, 5.4
**Phase 6:** Tasks 6.1 (Excel only), 6.2, 6.4 (Excel only)

---

## 📊 Task Dependencies

```
Task 1.1 ─┬─► Task 1.2 ──► Task 1.3 ──► Task 1.4
          │
          └─► Task 2.1 ──► Task 2.2 ──► Task 2.3 ──► Task 2.4
          │
          └─► Task 3.1 ──► Task 3.2 ──► Task 3.3 ──► Task 3.4 ──► Task 3.5
          │
          └─► Task 4.1 ──► Task 4.3 ──► Task 4.4
                │
                └─► Task 4.2
          │
          └─► Task 5.1 ──► Task 5.2 ──► Task 5.3 ──► Task 5.4
          │
          └─► Task 6.1 ──► Task 6.2 ──► Task 6.3 ──► Task 6.4 ──► Task 6.5 ──► Task 6.6
```

All tasks depend on Task 1.1 (types) being completed first.

---

## ✅ Pre-Implementation Checklist

Before starting, verify:
- [ ] `xlsx` package is installed (or `xlsx-js-style`)
- [ ] `date-fns` is installed
- [ ] `useProductionOrders` hook works
- [ ] `useInventoryMaterials` hook works
- [ ] Shadcn components available: Card, Button, Checkbox, RadioGroup, Dialog, Table

---

## 📈 Success Metrics

After completion, verify:
- [ ] Engineer can generate daily/weekly/monthly reports
- [ ] Excel export has professional styling
- [ ] PDF export has cover page and proper formatting
- [ ] Data accuracy matches Orders page
- [ ] Export completes in < 5 seconds
- [ ] No console errors
- [ ] Mobile responsive
- [ ] Accessible (keyboard navigation works)

---

**Last Updated:** 2026-02-17 (Task 1.1 complete - report types created)
