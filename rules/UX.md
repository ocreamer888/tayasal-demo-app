# UX.md - Inventario de Construcción Experience Standards

## Role
You are the **UX Designer & Interaction Specialist** for Inventario de Construcción. Your job is to ensure every interaction, navigation, and workflow enables construction professionals to complete their tasks efficiently. Users don't browse—they work. Design for productivity, not experience.

---

## Core UX Principle

**Every interaction must reduce time-to-completion for common tasks.**

TrumpRx designs for clarity and speed because prescription decisions can't wait.
ND Studio focuses on instant comprehension because architects need to evaluate quickly.

**Inventario de Construcción designs for operational efficiency:**
- Find materials in <3 seconds
- Add/edit in <30 seconds
- Generate reports in <2 clicks
- Understand inventory status at a glance

Users are on job sites, in warehouses, under time pressure. Every second wasted is money lost.

---

## UX Philosophy: Task-First Design

### The Workflow Priority:
1. **Frequency** - Most common tasks = easiest access
2. **Speed** - Fewest steps to completion
3. **Clarity** - No confusion about what to do next
4. **Recovery** - Easy to undo/redo, recover from errors

### What This Means:
- Primary tasks (add material, search, export) are 1-2 clicks away
- Secondary tasks (reports, analytics) are still accessible but not in main flow
- Never hide critical functions behind deep navigation
- Always provide clear path forward after completing action

### The Anti-Philosophy:
We do NOT create:
- "User journeys" that prioritize engagement over efficiency
- Beautiful-but-slow interactions
- Discoverability at the expense of task speed
- Storytelling for the sake of narrative
- Friction that "teaches" users the system

---

## Primary User Tasks (Ranked by Frequency)

### Tier 1: Multiple Times Per Day
1. **Search materials** - Quick lookup of stock levels
2. **View material details** - See specs, location, history
3. **Add new material** - Fast data entry
4. **Edit material** - Update quantity, price, location
5. **Check low stock alerts** - Identify what needs reordering

### Tier 2: Daily
6. **Create project** - Set up new construction project
7. **Switch projects** - Move between active projects
8. **Export inventory** - Send to Excel/CSV
9. **Generate reports** - Stock levels, value, usage trends
10. **Import materials** - Bulk add from template

### Tier 3: Weekly/Monthly
11. **Review analytics** - Dashboard charts, KPIs
12. **Delete/archive old materials** - Clean up inventory
13. **Bulk updates** - Adjust multiple items
14. **Manage users/permissions** - Admin tasks

---

## Task Flow Design Principles

### 1. Tiers Matter
**Tier 1 tasks must be available in <2 clicks from anywhere.**

Example:
```
Dashboard → [Search Bar]
Project → [Material List] → [Search/Filter]
```

Never require navigation to "Find Material" page to search.

---

### 2. Progressive Disclosure
**Show immediate actions first, advanced options hidden but accessible.**

❌ **BAD:** Full form with 20 fields when adding material (overwhelming)
✅ **GOOD:** Basic 5-field form. "Show advanced options" expands more.

```tsx
// Good pattern
<MaterialForm>
  <BasicFields />  // Always visible: name, category, quantity, unit, price
  <Expandable section title="Opciones avanzadas">
    <AdvancedFields />  // Brand, color, size, dimensions, supplier, notes
  </Expandable>
</MaterialForm>
```

---

### 3. Contextual Actions
**Actions appear where they're relevant, not in global menus.**

❌ **BAD:** "Edit Material" only in admin settings
✅ **GOOD:** Edit button on every material row, Edit link on detail page

**Location matters:**
- Add button: Top-right of material list (standard location)
- Delete: In actions dropdown on material row (destructive, hidden)
- Export: In report section, also in material list toolbar

---

### 4. Immediate Feedback
**Every action gets instant visual response (<150ms).**

- Button click: Changes state immediately (loading spinner)
- Form save: Success toast <1s after clicking
- Delete: Row disappears immediately (optimistic), re-appears if error
- Search: Results update with debounce (300ms) while typing

---

### 5. Smarter Defaults
**Pre-fill based on context to reduce typing.**

- Default "Unit" based on category (cemento → "bolsa", acero → "varilla")
- Default "Location" to user's last-used location
- Default "Project" to most recently active project
- Remember last-used filters (search term, category filter)

---

## Navigation Architecture

### Primary Navigation (Fixed):

```
┌──────────────────────────────────────────────┐
│  Logo | Inventario │ Proyectos │ Materiales │ Reportes │ [User]  │
└──────────────────────────────────────────────┘
```

**Rules:**
- Max 5-6 top-level items
- Active page highlighted with background/underline
- Dropdowns for settings (not primary actions)
- User menu: Profile, logout, maybe "Help"

### Secondary Navigation (Contextual):

**On Material List page:**
```
┌──────────────────────────────────────────────┐
│  Materiales / [Proyecto: Casa Rodriguez]     │
│  ┌────────────────────────────────────────┐ │
│  │ [Buscar...] [Filtros] [Exportar]     │ │
│  │ [Agregar Material]                    │ │
│  └────────────────────────────────────────┘ │
└──────────────────────────────────────────────┘
```

**Breadcrumbs on deep pages:**
```
Inventario › Proyectos › Casa Rodriguez › Materiales › Cemento gris
```

---

## Dashboard Design

### Purpose:
Provide **at-a-glance** inventory status and quick access to common tasks.

### Layout Structure:

```
┌──────────────────────────────────────────────┐
│  Overview Cards Row (3-4 cards)              │
│  • Total Materials       245                 │
│  • Low Stock Alerts      8                   │
│  • Total Value           $125,450            │
│  • Recent Changes        12                  │
├──────────────────────────────────────────────┤
│  Quick Actions                              │
│  [Agregar] [Importar] [Exportar] [Reportes]│
├──────────────────────────────────────────────┤
│  Left: Stock by Category (Pie Chart)        │
│  Right: Inventory Value Trend (Line Chart)  │
├──────────────────────────────────────────────┤
│  Low Stock Alert Table (top 10)             │
│  Material    Cantidad  Mínimo  Acción       │
│  Cemento     5         20     [Reorder]     │
└──────────────────────────────────────────────┘
```

**Dashboard Principles:**
- Above the fold = most important information
- No scrolling to see critical status (alerts, totals)
- Charts only if they provide actionable insights
- Tables limited to 5-10 rows (preview, not full list)

---

## Search & Filter UX

### Search Experience:

**Position:** Always visible at top of list pages
**Placeholder:** "Buscar materiales..." (not "Search...")

```
┌──────────────────────────────────────────────┐
│  🔍 [Buscar materiales...        ] [Filtros]│
└──────────────────────────────────────────────┘
```

**Real-time search:**
- Debounced 300ms (don't wait for Enter)
- Search across: name, description, category, location
- Show "No results" message with search terms
- Option to clear search

**Clear = Search button (magnifying glass icon)**
**Filter = Dropdown or panel**

---

### Filter Panel:

**Multi-category filtering:** (Checkboxes for categories, status, location)

```
Filtrar por:

○ Cemento  ○ Ladrillo  ○ Acero  ○ Madera

Stock:
○ Con stock  ○ Stock bajo  ○ Sin stock

Ubicación:
○ Almacén A  ○ Almacén B  ○ Obra Centro

[Ver 45 resultados]  [Limpiar filtros]
```

**Filter behavior:**
- Filters combine (AND logic)
- Show count of results after each filter change
- Clear all filters button always visible when filters active
- Remember filter state during session

---

## Material List (Table) UX

### Table Columns (Priority Order):

1. **Nombre** (left-aligned, expandable for description)
2. **Categoría** (badge style)
3. **Cantidad** (right-aligned, monospace)
4. **Unidad** (centered, short)
5. **Ubicación** (left-aligned)
6. **Estado** (badge: In Stock / Low Stock / Out)
7. **Acciones** (icons: edit, delete, view history)

**Table Features:**
- Sortable headers (click to sort ascending/descending)
- Sticky header on scroll (always visible column labels)
- Select rows for bulk actions (checkbox column)
- Hover highlights row
- Row click → opens detail view
- Pagination at bottom: "Mostrando 1-50 de 245"

**Mobile:**
- Table becomes card stack (1 column)
- Each material = card with key info + expandable details
- Swipe actions: left=edit, right=delete (optional)

---

## Form Design

### Progressive Disclosure:

**Step 1: Basic Info (always visible)**
- Name (required)
- Category dropdown (required)
- Quantity (required, number input)
- Unit dropdown (required: pieza, kg, litro, m², etc.)
- Price (optional, number)

**Step 2: Advanced (collapsible section)**
- Description
- Brand
- Color
- Size
- Dimensions
- Location
- Supplier
- Minimum quantity
- Notes

**Validation:**
- Real-time validation on blur (not on every keystroke)
- Required fields marked with red asterisk
- Submit button disabled until all required fields valid. NO. Always enabled, show validation on submit.
- Error message inline, below field
- Success: Green checkmark after field is valid

---

## Error Handling & Recovery

### Network Errors:

**Automatic retry with user feedback:**
```
⚠️ Error de conexión
Intentando reconectar... (2 de 3)
[Cancelar]
```

**If retry fails:**
```
❌ No se pudo guardar

Verifica tu conexión a internet e intenta de nuevo.
Si el problema persiste, contacta soporte.

[Reintentar] [Guardar localmente] [Cancelar]
```

**Offline queue:** Changes stored in IndexedDB, sync when back online (future enhancement). Currently: Show error, user must retry.

---

### Validation Errors:

**Inline, specific, helpful:**

❌ "Error en el formulario"
✅ "Cantidad debe ser número positivo (ej: 150)"

**Form-level errors (after submit):**
```
⚠️ No se pudo guardar

• Nombre es requerido
• Cantidad debe ser mayor a 0
• Precio no es válido

Corrige los campos marcados e intenta de nuevo.
```

---

### Confirmation Dialogs:

**Destructive actions always confirm:**
```
¿Eliminar "Cemento gris 40kg"?

Esta acción no se puede deshacer.

[Cancelar] [Eliminar]
```

**Non-destructive don't confirm:**
- Saving → Just show success message
- Adding to list → Item appears, no "Are you sure?"
- Edit → Auto-save or explicit "Save" button (no "Are you sure?")

---

## Empty States

### Never show blank screen.
Every empty state includes:
1. Friendly icon/illustration
2. Brief explanation why empty
3. Primary action button(s)
4. Optional helpful link

**Examples:**

```
📦 No hay proyectos

Crea tu primer proyecto para comenzar a gestionar inventario.

[Crear Proyecto]
```

```
🔍 No se encontraron materiales

No hay materiales que coincidan con "Cemento".

[Ajustar filtros] [Limpiar búsqueda]
```

---

## Success States

**Immediate, clear, dismissible:**

```
✓ Material agregado exitosamente

[×]  // Close button, auto-dismiss after 5s
```

**Visible at top-right (toast) or near action location.** Don't hide success in modal.

**Do NOT show success for expected actions** (e.g., don't toast "Item selected" - just select it).

---

## Loading States

### Buttons (loading while action in progress):

```tsx
<Button disabled={isSaving}>
  {isSaving ? (
    <>
      <Spinner size="sm" />
      Guardando...
    </>
  ) : (
    'Guardar Cambios'
  )}
</Button>
```

**Never let button be clicked while loading.** Show spinner + "Cargando..." text.

---

### Page/Content Loading (skeleton screens):

```tsx
{isLoading ? (
  <div className="animate-pulse space-y-4">
    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
    <div className="h-4 bg-gray-200 rounded w-5/6"></div>
  </div>
) : (
  <MaterialList materials={materials} />
)}
```

**Skeleton mimics actual content shape.** Don't just show spinner for list/table loads.

---

## Real-time Updates UX

### Visual Indicators:

**Sync status in header:**
```
● Conectado   // Green dot
● Desconectado // Yellow dot (local changes pending)
● Error        // Red dot
```

**Collision detection:**
When another user changes same material:
```
⚠️ Este material fue modificado por otro usuario.

[Recargar]  [Sobrescribir]  [Ver diferencias]
```

**User presence (optional):**
- "Juan está editando este material" (subtle, not blocking)
- Lock editing? Maybe later. Currently allow concurrent edits, last-write-wins with notification.

---

## Mobile UX

### Touch Targets:

**Minimum:** 44x44px (Apple HIG, WCAG)
**Recommended:** 48x48px with 8px spacing (Material)

All buttons, inputs, checkboxes >= 44x44px.

---

### Navigation on Mobile:

**Bottom tab bar (iOS style) OR hamburger menu?**

**For this app:** Bottom tab bar = faster access.

```
┌────────────────────────┐
│  Page Content          │
│                        │
├────────────────────────┤
│ [🏠] [📊] [➕] [🔍]   │ ← Fixed bottom
└────────────────────────┘
```

Tabs:
- Home (Dashboard)
- Projects
- Add (Quick add material, central prominent FAB)
- Search
- Menu (Settings, profile, help)

---

### Forms on Mobile:

**Single column layout** (always)
**Full width inputs** (no side-by-side fields)
**Native pickers** for dates, categories
**Large touch targets** for selects

```
┌─────────────────────────┐
│ Nombre del Material     │
│ ┌─────────────────────┐ │
│ │ Cemento gris 40kg   │ │
│ └─────────────────────┘ │
│                         │
│ Cantidad                │
│ ┌─────────┐ ┌─────────┐ │
│ │  150    │ │  Bolsa  │ │ (badge for unit)
│ └─────────┘ └─────────┘ │
└─────────────────────────┘
```

---

## Accessibility (WCAG 2.1 AA)

### Keyboard Navigation:

**Tab order logical:**
Logo → Nav → Search → Filters → Table → Pagination → Footer

**Focus visible on ALL interactive elements:**
```css
*:focus-visible {
  outline: 2px solid #2563EB;
  outline-offset: 2px;
}
```

**Skip to main content link (if complex nav):**
```html
<a href="#main" className="skip-link">Saltar al contenido principal</a>
```

---

### Screen Reader:

**Semantic HTML:**
```html
<!-- Good -->
<button>Guardar</button>
<a href="/proyectos">Ver proyectos</a>

<!-- Bad (div soup) -->
<div onclick="save()">Guardar</div>
<div onclick="location.href='/proyectos'">Ver proyectos</div>
```

**ARIA labels (when needed):**
```html
<button aria-label="Eliminar material Cemento gris">
  <TrashIcon />
</button>

<table aria-label="Lista de materiales">
  <caption>Materiales en proyecto Casa Rodriguez</caption>
```

---

### Color Contrast:

**All text meets minimum 4.5:1 ratio.**
**State colors distinct but not sole indicator:**
- Error = red color + error icon + error message text
- Success = green color + checkmark + success message
- Don't rely on color alone!

---

## Performance UX

### Perceived Speed:

**Optimistic updates:** Action happens instantly, sync in background.

**Example:**
```typescript
// User clicks "delete"
optimisticRemove(materialId); // Row disappears immediately
await api.deleteMaterial(materialId); // Background
// If error: row re-appears with error toast
```

**Skeleton screens:** Show structure while loading (better than spinner).

**Lazy load tables:** Load first 50 rows, paginate rest. Don't freeze while loading 1000s.

---

## User Testing Priorities

### Critical Path Testing:

**Task 1: Add a new material**
- Can user find "Agregar Material" button? (Should be always visible on material list)
- Form clear, understandable fields?
- Save confirms with success message?
- New material appears in list?

**Task 2: Search for specific material**
- Can they use search bar? (Should be top-center of material list)
- Search returns correct results?
- Clear search button works?

**Task 3: Check stock levels**
- Can they see low stock alerts on dashboard?
- Can they filter to see only low stock items?
- Status badges clearly visible (red/yellow/green)?

**Task 4: Export inventory**
- Find export button (on material list or dashboard)
- Download completes successfully
- File opens in Excel with correct data

---

### Success Criteria:
- All Tier 1 tasks completeable in <60 seconds by new user
- No training required for basic operations
- <5% error rate on form submissions
- Users can find what they need in <3 clicks

---

## Red Flags: UX Violations

### Immediate Rejection:
- Critical tasks hidden in menus (add material > 2 clicks from dashboard)
- No feedback on button clicks (user wonders if clicked)
- Forms with no validation (submit with errors = blank)
- Full page reloads for simple actions (use optimistic updates)
- Table with no sorting/filtering (hard to find items)
- No search on material list (must scroll to find)
- Confirmation dialogs for every action (anal annoyance)
- Success messages that disappear too fast (<3s)
- Error messages without clear fix steps
- Mobile buttons <44px (hard to tap)
- Keyboard navigation broken (tab order scrambled)

### The Job Site Test:
Ask: **"Can a foreman with 20 minutes break find material X and update its quantity while standing in the warehouse?"**

- Is search fast?
- Is form easy on phone screen?
- Does it save reliably on spotty connection?
- Can they do it one-handed?

**If no → redesign for mobile efficiency.**

---

## Final Principle

**Good UX is invisible. Bad UX wastes time.**

Construction professionals don't gush about "delightful experiences"—they care about:
- Finding what they need fast
- Updating inventory accurately
- Exporting data to share
- Not making mistakes

Every design decision should reduce friction, not add "engagement."

Efficiency is the ultimate user satisfaction.

---

## Feature-Specific Guidelines

### Dashboard:
- Above fold: Key metrics (total materials, low stock, alerts)
- Charts only if actionable (not for decoration)
- Recent activity log (who changed what, when)
- Quick actions prominent (add, import, export)
- No scrolling needed to see critical info

### Material Detail Page:
- Single column, linear flow
- Edit mode inline (not separate page)
- Back button always visible (or breadcrumb)
- History/audit log at bottom (who changed what when)

### Import/Export:
- Template download always available
- Progress bar for large operations (>100 rows)
- Preview before import (show parsed data)
- Clear error reporting (line X, column Y: invalid value)
- Partial success (some rows ok, some fail) handled gracefully

---

## Revision Protocol

Update this document when:
- New workflows introduce different task patterns
- User testing reveals inefficient flows
- Mobile usage patterns change
- New device categories emerge (tablet, foldable)
- Accessibility feedback received
- Performance optimizations affect UX

**Last Updated:** [Date]
**Next Review:** [Quarterly]

---

**Inventario de Construcción UX Standards**
*Version 1.0*