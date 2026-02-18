# ReportGenerator Implementation Plan

**Created:** 2026-02-17
**Status:** Planning
**Priority:** High (Tier 3 feature)
**Estimated Effort:** 22 hours (full featured) or 8 hours (MVP)

---

## 🎯 Vision

Export professional production reports (Excel/PDF) for daily, weekly, and monthly cycles. Engineers can extract all production data in clean, business-ready formats for management reporting and offline analysis.

---

## 📋 User Story

**As an** engineer
**I want to** generate production reports for specific time periods (daily/weekly/monthly/custom)
**So that** I can export professional Excel and PDF documents to share with management, do offline analysis, and maintain archival records.

---

## ✨ Core Features

- ✅ **Cycle selection:** Daily, Weekly, Monthly, Custom date range
- ✅ **Data sections:** Choose to include Orders, Costs, Inventory, Summary
- ✅ **Export formats:** Excel (.xlsx) and PDF (.pdf)
- ✅ **Professional formatting:** Clean corporate layout with Tayasal branding
- ✅ **Preview before export:** See aggregated data before downloading
- ✅ **Role-based access:** Engineers and admins only (operators cannot export)

---

## 🏗️ Technical Architecture

### Component Structure

```
src/
├── components/
│   └── reports/
│       ├── ReportGenerator.tsx      # Main component with form
│       ├── ReportForm.tsx           # Form inputs (dates, cycle, sections, format)
│       ├── ReportPreview.tsx        # Preview table (modal/panel)
│       └── ReportTable.tsx          # Generic table for preview
├── lib/
│   ├── utils/
│   │   ├── report-data-aggregator.ts   # Data aggregation logic
│   │   ├── excel-exporter.ts           # xlsx generation with styling
│   │   ├── pdf-exporter.ts             # jspdf generation with styling
│   │   └── report-templates.ts         # Preset cycle templates
│   └── types/
│       └── reports.ts                  # TypeScript interfaces
└── app/
    └── reports/
        └── page.tsx                    # Reports page (engineer/admin only)
```

---

## 📊 Data Sources & Aggregation

### Primary Data

All data pulled from existing hooks:

```typescript
// Data sources
production_orders → useProductionOrders()
inventory_materials → useInventoryMaterials()
concrete_plants → useConcretePlants() (optional)
equipments → useEquipment() (optional)
team_members → useTeamMembers() (optional)
```

### Aggregation Functions

**ReportDataAggregator** (`lib/utils/report-data-aggregator.ts`):

```typescript
interface ReportData {
  period: DateRange
  orders: ProductionOrder[]
  summary: {
    totalOrders: number
    totalBlocks: number
    totalCost: number
    avgCostPerBlock: number
    blocksPerHour: number
    topBlockType: string
  }
  costsByCategory: {
    materials: number
    labor: number
    equipment: number
    energy: number
  }
  inventoryChanges: InventorySnapshot[] // if requested
}

function getOrdersInRange(startDate: Date, endDate: Date): Promise<ProductionOrder[]>
function aggregateOrders(orders: ProductionOrder[]): ReportData
function calculateDailyMetrics(orders: ProductionOrder[]): Summary
function calculateWeeklyMetrics(orders: ProductionOrder[]): Summary
function calculateMonthlyMetrics(orders: ProductionOrder[]): Summary
```

---

## 📑 Report Structure (Excel - 4 Sheets)

### Sheet 1: Resumen Ejecutivo (Executive Summary)

```
┌────────────────────────────────────────────────────────┐
│ Tayasal - Informe de Producción                        │
│ Período: [start] - [end]                               │
│ Generado: [date]                                       │
│                                                       │
│ ───────────────────────────────────────────────────── │
│ MÉTRICAS CLAVE                                        │
│ • Órdenes Totales: ###                                │
│ • Bloques Producidos: ###                             │
│ • Costo Total: $XXX,XXX                               │
│ • Costo Promedio/Bloque: $XX.XX                       │
│ • Bloques por Hora: XX                                │
│ • Tipo de Bloque Principal: [XXXXX]                   │
└────────────────────────────────────────────────────────┘
```

**Styling:**
- Title: 16pt, bold, green (#22C55E)
- Section headers: 12pt, bold, dark gray
- Metrics: 11pt, with key metrics highlighted in green

---

### Sheet 2: Órdenes de Producción (Orders Detail)

```
┌────┬────────────┬─────────────┬──────────┬──────────┬─────────────┬────────────┬────────────┬────────────┬────────────┐
│ ID │ Fecha      │ Tipo        │ Cantidad │ Estado   │ Materiales  │ Mano Obra  │ Equipo     │ Total      │ Operario   │
├────┼────────────┼─────────────┼──────────┼──────────┼─────────────┼────────────┼────────────┼────────────┼────────────┤
│ 001│ 15/02/2025 │ Ladrillos   │ 500      │ Aprobado │ $15,000     │ $8,000     │ $3,000     │ $26,000    │ Juan P.    │
│ ...│ ...        │ ...         │ ...      │ ...      │ ...         │ ...        │ ...        │ ...        │ ...        │
└────┴────────────┴─────────────┴──────────┴──────────┴─────────────┴────────────┼────────────┼────────────┼────────────┘
```

**Styling:**
- Header row: Dark green background (#15803d), white text, bold
- Data rows: Alternating white / light gray (#f9fafb)
- Currency columns: CLP format with thousand separators
- Borders: Thin black on all cells
- Column widths: Auto-fit with min/max constraints

---

### Sheet 3: Análisis de Costos (Cost Analysis)

```
┌──────────────────┬────────────┬────────────┐
│ Categoría        │ Monto      │ % del Total│
├──────────────────┼────────────┼────────────┤
│ Materiales       │ $XXX,XXX   │ XX%        │
│ Mano de Obra     │ $XXX,XXX   │ XX%        │
│ Equipo           │ $XXX,XXX   │ XX%        │
│ Energía          │ $XX,XXX    │ XX%        │
│ Mantenimiento    │ $X,XXX     │ XX%        │
├──────────────────┼────────────┼────────────┤
│ TOTAL            │ $XXX,XXX   │ 100%       │
└──────────────────┴────────────┴────────────┘
```

**Styling:**
- Total row: Bold, green accent, double border bottom
- Percentage column: Display as "XX%" with no decimals
- Currency: CLP format
- Pie chart note: "(See attached chart in PDF version)"

---

### Sheet 4: Impacto en Inventario (Inventory Impact)

Only included if user selects "Inventario" section:

```
┌────────────┬──────────────┬──────────┬──────────────┬────────────┬──────────────┐
│ Material   │ Stock Inicial│ Usado    │ Stock Final  │ U. Costo   │ Valor Total  │
├────────────┼──────────────┼──────────┼──────────────┼────────────┼──────────────┤
│ Cemento    │ 500          │ 50       │ 450          │ $5,000     │ $2,250,000   │
│ Arena      │ 1000         │ 200      │ 800          │ $2,000     │ $1,600,000   │
└────────────┴──────────────┴──────────┴──────────────┴────────────┴──────────────┘
```

**Styling:** Same pattern as Orders sheet with alternating rows.

---

## 📄 PDF Structure

PDF will mirror Excel content with slight adaptations for pagination:

1. **Cover Page**
   - Tayasal logo (if available) or header text
   - Title: "Informe de Producción"
   - Period, generation date
   - Company info

2. **Table of Contents** (optional, auto-generated)

3. **Executive Summary** (1 page)

4. **Orders Detail** (may span multiple pages, table breaks across pages)
   - Repeat header on each page

5. **Cost Analysis** (1 page with bar chart if possible)

6. **Inventory Impact** (if selected, 1-2 pages)

7. **Footer on every page**
   - "Generado por Tayasal"
   - Page X of Y
   - Confidential notice

---

## 🔨 Implementation Phases

### Phase 1: Data Aggregation (4 hours)

**Tasks:**
- [ ] Create `src/lib/types/reports.ts`:
  - `ReportConfig` interface (date range, cycle type, sections, format)
  - `ReportData` interface (orders, summary, costs, inventory)
  - `ExportFormat` type ('excel' | 'pdf' | 'both')
  - `CycleType` type ('daily' | 'weekly' | 'monthly' | 'custom')

- [ ] Create `src/lib/utils/report-templates.ts`:
  - `getDateRangeForCycle(cycle: CycleType, referenceDate?: Date): DateRange`
  - Presets:today, current week, current month start/end

- [ ] Create `src/lib/utils/report-data-aggregator.ts`:
  - `getOrdersInRange(startDate, endDate)` → filter from useProductionOrders
  - `aggregateOrders(orders, includeInventory?)` → full report data
  - Helper functions:
    - `calculateSummary(orders)`
    - `aggregateCosts(orders)`
    - `calculateInventoryChanges(orders, startDate, endDate)`

- [ ] Test aggregation logic with console.log or simple test page

**Dependencies:** useProductionOrders hook ✅ exists

---

### Phase 2: Excel Exporter (4 hours)

**Tasks:**
- [ ] Verify `xlsx` library capabilities (already installed)
  - Test: Can we apply cell styles? Colors, fonts, borders?
  - If `xlsx` limited, consider `xlsx-js-style` (more styling)

- [ ] Create `src/lib/utils/excel-exporter.ts`:
  - `exportToExcel(reportData: ReportData, config: ExportConfig): void`
  - Workbook creation:
    - Sheet 1: "Resumen" (executive summary)
    - Sheet 2: "Órdenes" (orders detail)
    - Sheet 3: "Costos" (cost analysis)
    - Sheet 4: "Inventario" (if included)
  - Styling:
    - Header styles: dark green fill, white bold font
    - Data cell borders: thin black
    - Alternating row colors: white / light gray
    - Currency format: `#,##0 CLP`
    - Date format: `DD/MM/YYYY`
    - Column auto-width based on content
    - Number formatting with thousand separators

- [ ] File naming:
  ```typescript
  const filename = `Tayasal_Produccion_${formatDate(startDate)}_${cycleType}.xlsx`
  ```

- [ ] Trigger download via blob URL

- [ ] Test with real data (50+ orders)
  - All sheets render correctly
  - Formulas if needed (totals)
  - Open in Excel/LibreOffice → formatting preserved

---

### Phase 3: PDF Exporter (4 hours)

**Tasks:**
- [ ] Install dependencies:
  ```bash
  npm install jspdf jspdf-autotable
  ```

- [ ] Create `src/lib/utils/pdf-exporter.ts`:
  - `exportToPDF(reportData: ReportData, config: ExportConfig): void`
  - PDF setup: portrait/landscape orientation (landscape for tables)
  - Cover page:
    - Title "Tayasal - Informe de Producción"
    - Period and generation date
    - Maybe a horizontal green line separator
  - Content pages:
    - Executive Summary (text block + key metrics)
    - Orders table (autoTable with column widths, break across pages)
    - Cost analysis table (add small bar chart if possible? or just table)
    - Inventory table if selected
  - Header/footer:
    - Footer: page number, "Confidencial - Generado por Tayasal"
  - Styling:
    - Font: Helvetica or Roboto (PDF built-in)
    - Primary color: #22C55E (green) for headers/highlights
    - Table styling: gray header with white text, borders

- [ ] Test PDF rendering:
  - Page breaks don't cut table rows in half (use `margin: { top: 20 }`, `didParseCell` hook)
  - Tables span multiple pages correctly
  - File size reasonable (< 1MB for 1000 rows)

---

### Phase 4: ReportGenerator Component (6 hours)

**Tasks:**
- [ ] Create `src/components/reports/ReportForm.tsx`:
  - Form fields:
    - **Cycle type:** Radio buttons or select: Daily | Weekly | Monthly | Custom
    - **Date input:** Dynamically show based on cycle:
      - Daily: single date picker (default: today)
      - Weekly: week picker (default: current ISO week)
      - Monthly: month picker (default: current month)
      - Custom: start date + end date
    - **Data sections:** Checkboxes (vertical):
      - [ ] Resumen Ejecutivo
      - [ ] Órdenes de Producción
      - [ ] Análisis de Costos
      - [ ] Impacto en Inventario
    - **Export format:** Radio buttons: Excel | PDF | Ambas (both)
    - **Preview checkbox:** (optional) "Vista previa antes de exportar"
  - Buttons:
    - "Vista Previa" (preview) - only if preview checked
    - "Exportar" (main action)
  - Validation:
    - If custom range: endDate >= startDate
    - At least one section selected
    - Date range not empty
  - Loading state: "Generando reporte..." spinner

- [ ] Create `src/components/reports/ReportPreview.tsx`:
  - Modal or side panel showing aggregated data
  - Show summary metrics in cards
  - Show table preview (first 50 rows) with scroll
  - "Cerrar" and "Exportar" buttons
  - Data loading indicator

- [ ] Create `src/components/reports/ReportGenerator.tsx`:
  - Main wrapper that puts it all together
  - Handles form state
  - Calls aggregator on submit/preview
  - Conditionally renders preview modal
  - On export: calls appropriate exporter (Excel, PDF, or both)
  - Download triggers file save dialog
  - Success toast: "Reporte generado exitosamente"
  - Error handling: show error toast if aggregation fails or no data

- [ ] Styling:
  - Use shadcn components: Card, Button, Checkbox, RadioGroup, Label
  - Green theme (primary)
  - Responsive layout

- [ ] Spanish labels throughout:
  - "Generar Reporte"
  - "Período"
  - "Tipo de ciclo"
  - "Secciones a incluir"
  - "Formato de exportación"
  - "Generando..." (loading)
  - "No hay datos para el período seleccionado" (no data)

---

### Phase 5: Reports Page Integration (4 hours)

**Tasks:**
- [ ] Create `/app/reports/page.tsx`:
  - Protected route (engineer/admin only) - use middleware or component guard
  - Layout: centered container, page title "Reportes de Producción"
  - Breadcrumbs: Dashboard > Reportes
  - Render `<ReportGenerator />`
  - Add helpful description text below title
  - Handle unauthorized access: redirect to /login or show 403

- [ ] Update `src/components/layout/nav-items.ts`:
  - Uncomment or re-add Reportes link (for engineer/admin only)
  ```typescript
  {
    label: "Reportes",
    href: "/reports",
    icon: FileText,
    roles: ['engineer', 'admin']
  }
  ```

- [ ] Test route protection:
  - Operator tries to access /reports → gets redirected or 403
  - Engineer can access freely

---

### Phase 6: Testing & Polish (4 hours)

**Tasks:**
- [ ] **Functional testing:**
  - Daily report (today) generates with orders
  - Weekly report (this week) includes correct date range
  - Monthly report (this month) aggregates properly
  - Custom range (Jan 1 - Jan 31) works
  - No orders in range → shows "No hay datos" (no crash)
  - All sections toggle correctly (uncheck inventory → inventory sheet omitted)
  - Excel export works (file downloads, opens correctly)
  - PDF export works (file downloads, readable)
  - Both formats selected → downloads both files

- [ ] **Data accuracy:**
  - Order counts match Orders page for same date range
  - Cost totals match sum of individual orders
  - Inventory changes reflect actual consumption during period
  - Currency values = CLP, formatted correctly

- [ ] **Performance:**
  - Large dataset (1000+ orders): aggregation < 2 seconds
  - Export (Excel) completes in < 5 seconds
  - Export (PDF) completes in < 8 seconds (slower due to PDF rendering)
  - Show loading indicators during processing

- [ ] **Professional appearance (Excel):**
  - Header rows: dark green background (#15803d), white bold text
  - Alternating rows: white / #f9fafb
  - Borders visible on all cells
  - Column widths auto-adjusted (no truncated content)
  - Sheets properly named (Resumen, Órdenes, Costos, Inventario)

- [ ] **Professional appearance (PDF):**
  - Cover page looks intentional (not blank)
  - Tables don't cut rows across pages
  - Page numbers appear on footer
  - Text readable (not too small, good contrast)
  - Company name/report title at top

- [ ] **Edge cases:**
  - Date range 1 year → warning or limit?
  - Very long material names → truncated with ellipsis or wrapped
  - Empty fields → display as "-" or "N/A"
  - Numeric overflow (CLP 999,999,999,999) → formatting OK?

- [ ] **UX improvements:**
  - After export: show toast "Reporte descargado: Tayasal_Produccion_2025-02-15_diario.xlsx"
  - Disable Export button while generating
  - Progress indicator: "Procesando 234 órdenes..."
  - "Generating report" loading overlay (not just button spinner)

---

## 📋 Checklist Before MVP Launch

### ReportGenerator Ready

- [ ] All 6 phases completed (Phases 1-5 + testing)
- [ ] Excel export works (all 4 sheets, formatted)
- [ ] PDF export works (professional multi-page)
- [ ] All cycle types work (daily, weekly, monthly, custom)
- [ ] All section combinations work (summary, orders, costs, inventory)
- [ ] Role-based access enforced (only engineer/admin)
- [ ] Navigation link to /reports exists and works
- [ ] No console errors during normal usage
- [ ] File naming convention correct
- [ ] Currency in CLP, dates in es-ES format
- [ ] Spanish labels throughout
- [ ] Performance acceptable (<5s for 1000 orders)
- [ ] Lint and build pass

---

## 🎯 Success Criteria

✅ Engineer logs in → sees "Reportes" in navigation (if engineer/admin)
✅ Clicks /reports → sees ReportGenerator page
✅ Selects "Monthly", January 2025, all sections, Excel → clicks Export
✅ Sees loading state: "Generando reporte de 123 órdenes..."
✅ Downloads file: `Tayasal_Produccion_2025-01-01_2025-01-31_mensual.xlsx`
✅ Opens in Excel → 4 sheets, professional formatting, data accurate
✅ Tries PDF format → same data, well-formatted multi-page PDF
✅ All dates in DD/MM/YYYY, all currency in CLP ($)
✅ No errors in browser console or during export
✅ Export takes <5 seconds for 100+ orders

---

## 🚀 MVP vs Full Feature Timeline

**MVP Version (8 hours / 1 day):**
- [x] Custom date range only (skip daily/weekly/monthly presets)
- [x] Excel only (skip PDF)
- [x] Orders detail sheet only (skip summary, costs, inventory)
- [x] Direct export (no preview)
- [ ] Still needs: aggregation + excel export + page integration

**Full Featured (22 hours / 3 days):**
- [x] All cycle types (daily/weekly/monthly/custom)
- [x] Both Excel and PDF
- [x] All 4 sheets (summary + orders + costs + inventory)
- [x] Preview functionality
- [x] Professional styling on all formats
- [x] Complete testing & polish

**Recommendation:** Build MVP first (get value quickly), then enhance to full featured in next iteration.

---

## 📦 Dependencies

**Already installed:**
- `xlsx` ✅ (for Excel export)
- `recharts` ✅ (for charts - might use for PDF charts?)
- `date-fns` ✅ (for date calculations)
- `lucide-react` ✅ (icons if needed)

**Need to install:**
- `jspdf` + `jspdf-autotable` (for PDF export) - **Phase 3**

**Existing dependencies to leverage:**
- `useProductionOrders` hook (data retrieval)
- `useInventoryMaterials` hook (inventory changes)
- Shadcn components: Button, Card, Checkbox, DatePicker, etc.
- `cn()` utility for conditional classes
- `formatCurrency` helper (if exists)

---

## 🎨 Design Guidelines (from UI.md)

- Color palette: Green primary (#22C55E), yellow warnings (#EAB308)
- Inter font for UI, maybe use built-in PDF font (Helvetica)
- 8px spacing grid
- Premium feel: subtle shadows, glassmorphism if appropriate
- All text in Spanish (neutral Latin American)

---

## 🐛 Known Risks

1. **Excel styling capabilities:** The `xlsx` package may have limited styling. May need `xlsx-js-style` or `xlsx-style` for full formatting.
   - **Mitigation:** Test early in Phase 2. If styling limited, switch libraries.

2. **PDF performance:** `jspdf` can be slow with large tables (>1000 rows).
   - **Mitigation:** Limit export to 500 rows max, or show warning for large datasets.

3. **Memory usage:** Loading 1000+ orders into memory for export could crash browser.
   - **Mitigation:** Stream export if needed, or implement pagination in export (multiple files).

4. **Date range complexity:** Weekly/Monthly determination depends on locale (Monday vs Sunday start).
   - **Mitigation:** Use `date-fns` week/month functions with consistent `es-ES` locale.

---

## 📝 Notes

- **Date ranges should use UTC** to avoid timezone shifts (store dates in DB as UTC midnight)
- **Export should be read-only** - no editing after download (Excel files not writable back to DB)
- **File security:** No sensitive data in filenames (no user IDs, only dates)
- **Audit trail:** Consider logging export actions (user, date, what was exported) → future audit_logs table

---

## 🔗 Related

- Task #13 in active-tasks.md: "Implement ReportGenerator with export"
- Project Context: `/memory/project-context.md` (Phase 7: Reports & Export)
- CLAUDE.md: Technical patterns (optimistic UI, rollback, real-time)
- PERFORMANCE.md: Performance targets (<500ms search, <2s page load)

---

**Status:** Ready for implementation. Start with Phase 1 (Data Aggregation) when ready.
