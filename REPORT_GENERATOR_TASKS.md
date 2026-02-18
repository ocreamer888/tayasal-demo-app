# ReportGenerator Implementation - Detailed Task List

**Created:** 2026-02-17
**Status:** Ready for Implementation
**Total Estimate:** 22 hours (full) / 8 hours (MVP)

---

## 📋 Phase 1: Data Types & Aggregation Layer (4 hours)

### Task 1.1: Create Type Definitions
**File:** `src/lib/types/reports.ts`
**Estimate:** 30 min

- [ ] Create `CycleType` union: `'daily' | 'weekly' | 'monthly' | 'custom'`
- [ ] Create `ExportFormat` union: `'excel' | 'pdf' | 'both'`
- [ ] Create `ReportSection` union: `'summary' | 'orders' | 'costs' | 'inventory'`
- [ ] Create `ReportConfig` interface:
  - `cycleType: CycleType`
  - `startDate: Date`
  - `endDate: Date`
  - `sections: ReportSection[]`
  - `format: ExportFormat`
- [ ] Create `ReportSummary` interface with metrics
- [ ] Create `ReportData` interface with orders, summary, costs, inventory
- [ ] Create `DateRange` interface: `{ start: Date; end: Date }`

### Task 1.2: Create Date Template Utilities
**File:** `src/lib/utils/report-templates.ts`
**Estimate:** 45 min

- [ ] Import date-fns functions (startOfDay, endOfDay, startOfWeek, etc.)
- [ ] Create `getDateRangeForCycle(cycle, referenceDate)` function
- [ ] Implement `getTodayRange()` - returns start/end of today
- [ ] Implement `getCurrentWeekRange()` - ISO week (Monday-Sunday)
- [ ] Implement `getCurrentMonthRange()` - first day to last day
- [ ] Implement `getCustomRange(startDate, endDate)` - validates range
- [ ] Add JSDoc comments for all functions
- [ ] Export all functions

### Task 1.3: Create Data Aggregator
**File:** `src/lib/utils/report-data-aggregator.ts`
**Estimate:** 2 hours

- [ ] Import types from reports.ts
- [ ] Create `filterOrdersByDate(orders, startDate, endDate)`:
  - Filter orders where created_at is within range
  - Handle timezone (use UTC midnight)
- [ ] Create `calculateSummary(orders)`:
  - totalOrders: count
  - totalBlocks: sum of block_quantity
  - totalCost: sum of total_cost
  - avgCostPerBlock: totalCost / totalBlocks
  - blocksPerHour: calculate from actual_time
  - topBlockType: most frequent block_type
- [ ] Create `aggregateCosts(orders)`:
  - materials: sum of materials_cost
  - labor: sum of labor_cost
  - equipment: sum of equipment_cost
  - energy: sum of energy_cost
  - maintenance: sum of maintenance_cost
- [ ] Create `calculateInventoryChanges(orders, materials)`:
  - Calculate consumption per material
  - Return inventory snapshots with before/after
- [ ] Create main `aggregateReportData(config)` function
- [ ] Add error handling for edge cases (no orders, division by zero)

### Task 1.4: Test Aggregation Logic
**Estimate:** 45 min

- [ ] Create test data: 5-10 sample orders with different dates
- [ ] Test date filtering with various ranges
- [ ] Verify summary calculations are accurate
- [ ] Verify cost aggregation matches expected totals
- [ ] Test with empty orders array (should not crash)
- [ ] Test edge case: single order
- [ ] Test edge case: orders spanning multiple months

---

## 📋 Phase 2: Excel Exporter (4 hours)

### Task 2.1: Verify xlsx Library Capabilities
**Estimate:** 30 min

- [ ] Check current xlsx package version in package.json
- [ ] Read xlsx documentation for styling capabilities
- [ ] Test: Can we apply cell styles (colors, fonts)?
- [ ] Test: Can we set column widths?
- [ ] Test: Can we add borders?
- [ ] Decision: Use standard xlsx or switch to xlsx-js-style?
- [ ] If switching: `npm uninstall xlsx && npm install xlsx-js-style`

### Task 2.2: Create Excel Workbook Builder
**File:** `src/lib/utils/excel-exporter.ts`
**Estimate:** 2 hours

- [ ] Import xlsx library
- [ ] Import ReportData types
- [ ] Create helper: `createStyles()` - returns style objects
- [ ] Create helper: `formatCurrencyCLP(value)` - returns formatted string
- [ ] Create helper: `formatDateES(date)` - returns DD/MM/YYYY
- [ ] Create `buildSummarySheet(workbook, data)`:
  - Add worksheet named "Resumen"
  - Title row with styling
  - Metrics rows (total orders, blocks, costs, etc.)
  - Apply green header styling
- [ ] Create `buildOrdersSheet(workbook, data)`:
  - Add worksheet named "Órdenes"
  - Header row: ID, Fecha, Tipo, Cantidad, Estado, Materiales, Mano Obra, Equipo, Total, Operario
  - Apply dark green header style
  - Add data rows with alternating colors
  - Set column widths
  - Add borders
- [ ] Create `buildCostsSheet(workbook, data)`:
  - Add worksheet named "Costos"
  - Category, Monto, % del Total columns
  - Total row with double border
- [ ] Create `buildInventorySheet(workbook, data)`:
  - Add worksheet named "Inventario"
  - Only if inventory section selected

### Task 2.3: Add Excel Export Function
**File:** `src/lib/utils/excel-exporter.ts` (continued)
**Estimate:** 1 hour

- [ ] Create `exportToExcel(reportData, config)`:
  - Create new workbook
  - Call sheet builders based on selected sections
  - Generate filename: `Tayasal_Produccion_YYYYMMDD_ciclo.xlsx`
  - Write to blob
  - Trigger download via anchor tag
- [ ] Create `downloadFile(blob, filename)` helper
- [ ] Export main function

### Task 2.4: Test Excel Export
**Estimate:** 30 min

- [ ] Generate test report with sample data
- [ ] Download file and open in Excel
- [ ] Verify all sheets present
- [ ] Verify styling applied (headers green, alternating rows)
- [ ] Verify column widths reasonable
- [ ] Verify currency format CLP
- [ ] Verify date format DD/MM/YYYY
- [ ] Open in LibreOffice (compatibility check)

---

## 📋 Phase 3: PDF Exporter (4 hours)

### Task 3.1: Install PDF Dependencies
**Estimate:** 15 min

- [ ] `npm install jspdf jspdf-autotable`
- [ ] Verify installation in package.json
- [ ] Check TypeScript types are available

### Task 3.2: Create PDF Cover Page Builder
**File:** `src/lib/utils/pdf-exporter.ts`
**Estimate:** 45 min

- [ ] Import jspdf and jspdf-autotable
- [ ] Import ReportData types
- [ ] Create `addCoverPage(doc, reportData)`:
  - Add title: "Tayasal - Informe de Producción"
  - Add period dates
  - Add generation date
  - Add horizontal green line
  - Set font sizes and colors

### Task 3.3: Create PDF Table Builders
**File:** `src/lib/utils/pdf-exporter.ts` (continued)
**Estimate:** 1.5 hours

- [ ] Create `addExecutiveSummary(doc, data)`:
  - Key metrics as text blocks
  - Styling with green accents
- [ ] Create `addOrdersTable(doc, data)`:
  - Use autoTable plugin
  - Set column headers
  - Configure column widths
  - Enable page breaks
  - Repeat header on new pages
- [ ] Create `addCostsTable(doc, data)`:
  - Cost breakdown table
  - Total row with bold styling
- [ ] Create `addInventoryTable(doc, data)`:
  - Only if inventory included

### Task 3.4: Add PDF Export Function
**File:** `src/lib/utils/pdf-exporter.ts` (continued)
**Estimate:** 45 min

- [ ] Create `exportToPDF(reportData, config)`:
  - Create new jsPDF instance (landscape orientation)
  - Add cover page
  - Add executive summary
  - Add orders table
  - Add costs table
  - Add inventory table (if selected)
  - Add footer with page numbers
  - Generate filename: `Tayasal_Produccion_YYYYMMDD_ciclo.pdf`
  - Save/download PDF
- [ ] Export main function

### Task 3.5: Test PDF Export
**Estimate:** 45 min

- [ ] Generate test PDF with sample data
- [ ] Verify cover page displays correctly
- [ ] Verify tables span multiple pages
- [ ] Check page breaks don't cut rows
- [ ] Verify page numbers in footer
- [ ] Verify "Confidencial" text appears
- [ ] Check file size < 1MB for 100+ orders
- [ ] Test with 500+ rows (performance check)

---

## 📋 Phase 4: ReportGenerator UI Components (6 hours)

### Task 4.1: Create ReportForm Component
**File:** `src/components/reports/ReportForm.tsx`
**Estimate:** 2 hours

- [ ] Import React, hooks, and shadcn components
- [ ] Import types from reports.ts
- [ ] Import date-fns utilities
- [ ] Create component interface: `ReportFormProps`
- [ ] Create form state with useState:
  - cycleType: CycleType
  - startDate: Date | null
  - endDate: Date | null
  - sections: ReportSection[]
  - format: ExportFormat
  - showPreview: boolean
- [ ] Create cycle type selection (RadioGroup):
  - Daily, Weekly, Monthly, Custom
- [ ] Create date inputs (conditional on cycle):
  - Daily: single date picker
  - Weekly: week picker
  - Monthly: month picker
  - Custom: start + end date pickers
- [ ] Create sections checkboxes:
  - Resumen Ejecutivo
  - Órdenes de Producción
  - Análisis de Costos
  - Impacto en Inventario
- [ ] Create format radio buttons:
  - Excel, PDF, Ambas
- [ ] Create action buttons:
  - "Vista Previa" button
  - "Exportar" button (primary)
- [ ] Add validation:
  - At least one section selected
  - Valid date range
  - Show error messages
- [ ] Add loading state for export button

### Task 4.2: Create ReportPreview Component
**File:** `src/components/reports/ReportPreview.tsx`
**Estimate:** 1.5 hours

- [ ] Import shadcn Dialog, Card, Table components
- [ ] Create `ReportPreviewProps` interface
- [ ] Create modal Dialog component
- [ ] Add summary cards at top:
  - Total orders count
  - Total blocks produced
  - Total cost (CLP format)
  - Average cost per block
- [ ] Create preview table:
  - Show first 50 orders
  - Scrollable container
  - Columns match export format
- [ ] Add "Cerrar" button (closes modal)
- [ ] Add "Exportar" button (triggers export)
- [ ] Add loading state while data loads

### Task 4.3: Create ReportGenerator Main Component
**File:** `src/components/reports/ReportGenerator.tsx`
**Estimate:** 2 hours

- [ ] Import React, hooks, and utilities
- [ ] Import ReportForm, ReportPreview
- [ ] Import aggregator and exporters
- [ ] Import useProductionOrders hook
- [ ] Import useInventoryMaterials hook
- [ ] Create state:
  - showPreview: boolean
  - reportData: ReportData | null
  - isGenerating: boolean
  - error: string | null
- [ ] Create `handlePreview(config)` function:
  - Call aggregator with config
  - Set reportData
  - Open preview modal
- [ ] Create `handleExport(config)` function:
  - Set isGenerating true
  - Call aggregator
  - Call excelExporter or pdfExporter (or both)
  - Show success toast with filename
  - Set isGenerating false
  - Handle errors
- [ ] Render layout:
  - Card container
  - Title: "Generar Reporte"
  - Description text
  - ReportForm component
  - ReportPreview modal (conditional)
- [ ] Add loading overlay for export

### Task 4.4: Style Components
**File:** `src/components/reports/` (all components)
**Estimate:** 30 min

- [ ] Apply consistent spacing (8px grid)
- [ ] Use shadcn Card for container
- [ ] Use shadcn Button with green theme
- [ ] Use shadcn Checkbox and RadioGroup
- [ ] Ensure responsive layout
- [ ] Add Spanish labels throughout
- [ ] Verify accessibility (labels, focus states)

---

## 📋 Phase 5: Reports Page & Navigation (4 hours)

### Task 5.1: Create Reports Page
**File:** `src/app/reports/page.tsx`
**Estimate:** 1 hour

- [ ] Import React
- [ ] Import ReportGenerator component
- [ ] Import AuthContext (for role check)
- [ ] Import useRouter from next/navigation
- [ ] Create page component
- [ ] Add role-based guard:
  - Check if user is engineer or admin
  - If not, redirect to /dashboard or show 403
- [ ] Add page layout:
  - Container with max-width
  - Page title: "Reportes de Producción"
  - Breadcrumb: Dashboard > Reportes
  - Description text explaining feature
- [ ] Render ReportGenerator component
- [ ] Add loading state while checking auth

### Task 5.2: Update Navigation
**File:** `src/components/layout/nav-items.ts`
**Estimate:** 15 min

- [ ] Verify "Reportes" link exists (already there)
- [ ] Verify roles: ['engineer', 'admin']
- [ ] Verify icon: FileText
- [ ] Test navigation appears for engineers
- [ ] Test navigation hidden for operators

### Task 5.3: Add Route Protection
**Estimate:** 45 min

- [ ] Create middleware or page-level guard
- [ ] Test: Operator accesses /reports directly
- [ ] Expected: Redirect to /login or /dashboard with error message
- [ ] Test: Engineer accesses /reports
- [ ] Expected: Page loads normally
- [ ] Test: Unauthenticated user accesses /reports
- [ ] Expected: Redirect to /login

### Task 5.4: Test Page Integration
**Estimate:** 2 hours

- [ ] Load /reports page as engineer
- [ ] Verify ReportGenerator renders
- [ ] Test form interactions
- [ ] Test preview functionality
- [ ] Test export functionality
- [ ] Verify file downloads correctly
- [ ] Test with real production data
- [ ] Verify no console errors

---

## 📋 Phase 6: Testing & Polish (4 hours)

### Task 6.1: Functional Testing
**Estimate:** 1 hour

- [ ] Test daily report with today's orders
- [ ] Test weekly report with current week
- [ ] Test monthly report with current month
- [ ] Test custom date range (Jan 1 - Jan 31)
- [ ] Test with no orders in range
- [ ] Test all sections toggle on/off
- [ ] Test Excel export
- [ ] Test PDF export
- [ ] Test "Ambas" format (both files)
- [ ] Verify no crashes or errors

### Task 6.2: Data Accuracy Testing
**Estimate:** 45 min

- [ ] Compare order counts with Orders page
- [ ] Verify cost totals match individual orders
- [ ] Check inventory changes reflect actual consumption
- [ ] Verify currency format is CLP
- [ ] Verify date format is DD/MM/YYYY
- [ ] Test with 50+ orders
- [ ] Test with 100+ orders

### Task 6.3: Performance Testing
**Estimate:** 30 min

- [ ] Measure aggregation time for 100 orders
- [ ] Measure aggregation time for 500 orders
- [ ] Measure Excel export time
- [ ] Measure PDF export time
- [ ] Ensure < 5 seconds for Excel (< 1000 orders)
- [ ] Ensure < 8 seconds for PDF (< 1000 orders)
- [ ] Verify loading indicators appear

### Task 6.4: Professional Appearance Testing
**Estimate:** 45 min

**Excel:**
- [ ] Header rows: dark green (#15803d), white bold
- [ ] Alternating rows: white / #f9fafb
- [ ] Borders visible on all cells
- [ ] Column widths auto-adjusted
- [ ] Sheet names correct
- [ ] Opens in Excel without warnings
- [ ] Opens in LibreOffice correctly

**PDF:**
- [ ] Cover page looks professional
- [ ] Tables don't cut across pages
- [ ] Page numbers in footer
- [ ] "Confidencial" text visible
- [ ] Text readable (font size, contrast)

### Task 6.5: Edge Case Testing
**Estimate:** 30 min

- [ ] Test 1-year date range
- [ ] Test very long material names (truncation)
- [ ] Test empty/null fields display as "-" or "N/A"
- [ ] Test numeric overflow (CLP 999,999,999,999)
- [ ] Test with special characters in names
- [ ] Test export while offline (error handling)

### Task 6.6: UX Improvements
**Estimate:** 30 min

- [ ] Add filename to success toast
- [ ] Disable export button while generating
- [ ] Add progress indicator: "Procesando X órdenes..."
- [ ] Add loading overlay for export
- [ ] Ensure error messages are user-friendly
- [ ] Add help text explaining each section

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

**Last Updated:** 2026-02-17
