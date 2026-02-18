# UI.md - Sistema de Producción de Bloques Premium Design System

## Role
You are the **Premium Visual Design Architect** for Sistema de Producción de Bloques. Your mission is to create interfaces that merge **professional corporate aesthetics** with **exceptional usability** — the kind of design that makes users feel they're working with enterprise-grade software while maintaining intuitive, efficient workflows.

---

## Core Design Philosophy

**Premium doesn't mean complex. Excellence is in the details.**

We create interfaces that:
- Command attention through **visual hierarchy and compositional balance**
- Feel **substantial and trustworthy** through refined typography and spacing
- Use **color strategically** to guide, not decorate
- Implement **subtle depth** through layering and shadows
- Maintain **breathing room** that signals quality
- Follow **modern corporate design trends** (Notion, Linear, Stripe, Vercel)

---

## Brand Color System

### Theme Tokens (shadcn/ui)

The design system uses shadcn/ui's semantic color tokens defined as CSS custom properties in `src/app/globals.css`. The app runs in dark mode only; therefore the `.dark` values are the ones in effect.

```css
/* Background and foreground */
--background: #011300; /* Near-black greenish dark */
--foreground: #FAFAFA; /* Almost white */

/* Card and popover surfaces */
--card: #171717;
--card-foreground: #FAFAFA;
--popover: #171717;
--popover-foreground: #FAFAFA;

/* Primary actions */
--primary: #10B981; /* Emerald green */
--primary-foreground: #0A0A0A; /* Near black for contrast */

/* Secondary elements */
--secondary: #262626;
--secondary-foreground: #FAFAFA;

/* Muted text and backgrounds */
--muted: #262626;
--muted-foreground: #A3A3A3;

/* Accent (matches primary) */
--accent: #10B981;
--accent-foreground: #0A0A0A;

/* Destructive/error */
--destructive: #EF4444;

/* Borders, inputs, focus ring */
--border: #262626;
--input: #262626;
--ring: #10B981;

/* Sidebar-specific tokens */
--sidebar: #0A0A0A;
--sidebar-foreground: #FAFAFA;
--sidebar-primary: #10B981;
--sidebar-primary-foreground: #0A0A0A;
--sidebar-accent: #262626;
--sidebar-accent-foreground: #FAFAFA;
--sidebar-border: #262626;
--sidebar-ring: #10B981;

/* Chart color palette */
--chart-1: #34D399;
--chart-2: #10B981;
--chart-3: #FACC15; /* Yellow for warnings or highlights */
--chart-4: #EAB308;
--chart-5: #6EE7B7;
```

### Color Usage Strategy

- **Primary (`--primary`):** Main call-to-action buttons, success states, active navigation, positive metrics in charts.
- **Accent (`--accent`):** Secondary emphasis, matching primary.
- **Warning (`--chart-3` / `--chart-4`):** Use yellow tones for alert states, low inventory indicators, or attention-needed elements.
- **Destructive (`--destructive`):** Errors, delete actions, critical issues.
- **Muted (`--muted-foreground`):** Secondary text, disabled text, placeholder text.
- **Neutrals:** The neutral scale (`--neutral-0` to `--neutral-950`) is available for custom cases but semantic tokens are preferred.

**Dark Mode Only:** All components should rely on the CSS variables above rather than hard-coded colors. This ensures consistent theming and future flexibility.

---

## Typography System

### Font Stack

```css
/* Primary: Inter - Modern, highly legible, corporate standard */
font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;

/* For data/numbers: Tabular figures for alignment */
font-variant-numeric: tabular-nums;
```

**Why Inter?**
- Used by Stripe, GitHub, Linear, Notion
- Exceptional legibility at all sizes
- Professional without being boring
- Extensive weight range for hierarchy

### Type Scale (Corporate-Grade)

```css
/* Display - Hero sections */
text-display: 48px / 1.1 / 700;     /* Dashboard titles */
text-display-sm: 36px / 1.2 / 700;  /* Page headers */

/* Headings */
text-h1: 30px / 1.2 / 600;  /* Section headers */
text-h2: 24px / 1.3 / 600;  /* Card titles */
text-h3: 20px / 1.4 / 600;  /* Subsections */
text-h4: 18px / 1.4 / 500;  /* Small headers */

/* Body */
text-lg: 18px / 1.6 / 400;   /* Large body (forms) */
text-base: 16px / 1.5 / 400; /* Standard body */
text-sm: 14px / 1.5 / 400;   /* Table cells, secondary */
text-xs: 12px / 1.4 / 500;   /* Labels, captions */

/* Minimum: 14px for readability */
```

### Font Weights

```css
--weight-normal: 400;    /* Body text */
--weight-medium: 500;    /* Emphasized text, labels */
--weight-semibold: 600;  /* Headings, buttons */
--weight-bold: 700;      /* Display text, critical alerts */
```

### Advanced Typography

```css
/* Letter spacing for all-caps labels */
.label-caps {
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-size: 11px;
  font-weight: 600;
  color: var(--neutral-500);
}

/* Tabular numbers for data */
.data-number {
  font-variant-numeric: tabular-nums;
  font-feature-settings: 'tnum' 1;
}

/* Optical sizing for large text */
.display-text {
  font-optical-sizing: auto;
}
```

---

## Spacing & Layout System

### The 8px Grid (Industry Standard)

```css
--space-0: 0px;
--space-1: 4px;    /* Micro spacing */
--space-2: 8px;    /* Tight spacing */
--space-3: 12px;   /* Compact groups */
--space-4: 16px;   /* Standard gap */
--space-5: 20px;   /* Medium spacing */
--space-6: 24px;   /* Section spacing */
--space-8: 32px;   /* Large gaps */
--space-10: 40px;  /* Major sections */
--space-12: 48px;  /* Page sections */
--space-16: 64px;  /* Hero spacing */
--space-20: 80px;  /* Extra large */
--space-24: 96px;  /* Maximum spacing */
```

### Component Spacing

```css
/* Cards */
--card-padding-sm: 16px;
--card-padding-md: 24px;
--card-padding-lg: 32px;

/* Inputs */
--input-padding-y: 12px;
--input-padding-x: 16px;

/* Buttons */
--button-padding-sm: 8px 16px;
--button-padding-md: 12px 24px;
--button-padding-lg: 16px 32px;

/* Containers */
--container-padding: 24px;
--container-padding-lg: 40px;
```

### Layout Grid

```css
/* Max widths for content */
--width-sm: 640px;   /* Forms */
--width-md: 768px;   /* Single column */
--width-lg: 1024px;  /* Standard layout */
--width-xl: 1280px;  /* Dashboard */
--width-2xl: 1440px; /* Wide screens */
--width-full: 100%;  /* Edge-to-edge */
```

---

## Depth & Elevation System

### Shadow Layers (Subtle, Modern)

```css
/* Elevation levels */
--shadow-xs: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
--shadow-sm: 0 1px 3px 0 rgba(0, 0, 0, 0.08), 
             0 1px 2px -1px rgba(0, 0, 0, 0.08);
--shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.08), 
             0 2px 4px -2px rgba(0, 0, 0, 0.08);
--shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.08), 
             0 4px 6px -4px rgba(0, 0, 0, 0.08);
--shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.08), 
             0 8px 10px -6px rgba(0, 0, 0, 0.08);

/* Green glow for primary actions */
--shadow-green: 0 0 0 3px rgba(34, 197, 94, 0.1);

/* Yellow glow for warnings */
--shadow-yellow: 0 0 0 3px rgba(234, 179, 8, 0.1);
```

### Surface Hierarchy

```css
/* Level 0: Base background */
background: var(--neutral-50);

/* Level 1: Cards on background */
background: var(--neutral-0);
box-shadow: var(--shadow-sm);

/* Level 2: Modals, dropdowns */
background: var(--neutral-0);
box-shadow: var(--shadow-lg);

/* Level 3: Tooltips, overlays */
background: var(--neutral-0);
box-shadow: var(--shadow-xl);
```

---

## Component Design System

### Buttons (Premium Feel)

```css
/* Primary - Green CTA */
.btn-primary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  
  padding: 12px 24px;
  min-height: 44px;
  
  background: linear-gradient(180deg, 
    var(--green-500) 0%, 
    var(--green-600) 100%);
  color: white;
  
  font-size: 15px;
  font-weight: 600;
  letter-spacing: -0.01em;
  
  border: none;
  border-radius: 8px;
  
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05),
              inset 0 1px 0 rgba(255, 255, 255, 0.1);
  
  transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
}

.btn-primary:hover {
  background: linear-gradient(180deg, 
    var(--green-600) 0%, 
    var(--green-700) 100%);
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(34, 197, 94, 0.15),
              inset 0 1px 0 rgba(255, 255, 255, 0.1);
}

.btn-primary:active {
  transform: translateY(0);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1),
              inset 0 1px 2px rgba(0, 0, 0, 0.1);
}

.btn-primary:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.2);
}

/* Secondary - Outlined */
.btn-secondary {
  padding: 12px 24px;
  background: var(--neutral-0);
  color: var(--neutral-800);
  
  border: 1.5px solid var(--neutral-200);
  border-radius: 8px;
  
  font-size: 15px;
  font-weight: 500;
  
  transition: all 0.15s ease;
}

.btn-secondary:hover {
  background: var(--neutral-50);
  border-color: var(--neutral-300);
  transform: translateY(-1px);
  box-shadow: var(--shadow-sm);
}

/* Warning - Yellow accent */
.btn-warning {
  background: linear-gradient(180deg,
    var(--yellow-400) 0%,
    var(--yellow-500) 100%);
  color: var(--neutral-900);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05),
              inset 0 1px 0 rgba(255, 255, 255, 0.2);
}

.btn-warning:hover {
  background: linear-gradient(180deg,
    var(--yellow-500) 0%,
    var(--yellow-600) 100%);
}

/* Ghost - Minimal */
.btn-ghost {
  padding: 12px 16px;
  background: transparent;
  color: var(--neutral-700);
  border: none;
  font-weight: 500;
}

.btn-ghost:hover {
  background: var(--neutral-100);
  color: var(--neutral-900);
}

/* Icon button */
.btn-icon {
  padding: 10px;
  min-width: 40px;
  min-height: 40px;
  border-radius: 8px;
}
```

### Form Inputs (Refined)

```css
.input {
  width: 100%;
  padding: 12px 16px;
  
  font-size: 15px;
  font-weight: 400;
  color: var(--neutral-900);
  
  background: var(--neutral-0);
  border: 1.5px solid var(--neutral-200);
  border-radius: 8px;
  
  transition: all 0.2s ease;
  
  /* Prevent iOS zoom */
  font-size: max(15px, 1rem);
}

.input::placeholder {
  color: var(--neutral-400);
  font-weight: 400;
}

.input:hover {
  border-color: var(--neutral-300);
}

.input:focus {
  outline: none;
  border-color: var(--green-500);
  box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.08);
}

.input:disabled {
  background: var(--neutral-50);
  color: var(--neutral-400);
  cursor: not-allowed;
  border-color: var(--neutral-200);
}

.input.error {
  border-color: var(--status-error);
}

.input.error:focus {
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.08);
}

/* Input with icon */
.input-group {
  position: relative;
}

.input-icon {
  position: absolute;
  left: 16px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--neutral-400);
  pointer-events: none;
}

.input-group .input {
  padding-left: 44px;
}
```

### Cards (Premium Surfaces)

```css
/* Standard card */
.card {
  background: var(--neutral-0);
  border: 1px solid var(--neutral-100);
  border-radius: 12px;
  padding: 24px;
  
  box-shadow: var(--shadow-sm);
  
  transition: all 0.2s ease;
}

.card:hover {
  border-color: var(--neutral-200);
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}

/* Metric card with accent */
.card-metric {
  background: linear-gradient(135deg,
    var(--neutral-0) 0%,
    var(--green-50) 100%);
  border: 1px solid var(--green-100);
  border-radius: 16px;
  padding: 28px;
  
  position: relative;
  overflow: hidden;
}

.card-metric::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 4px;
  height: 100%;
  background: linear-gradient(180deg,
    var(--green-500) 0%,
    var(--green-600) 100%);
}

.card-metric .value {
  font-size: 40px;
  font-weight: 700;
  line-height: 1;
  color: var(--neutral-900);
  margin-bottom: 8px;
  
  font-variant-numeric: tabular-nums;
}

.card-metric .label {
  font-size: 13px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--neutral-500);
}

.card-metric .trend {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin-top: 12px;
  
  font-size: 14px;
  font-weight: 600;
}

.card-metric .trend.positive {
  color: var(--green-600);
}

.card-metric .trend.negative {
  color: var(--status-error);
}

/* Elevated card (modals, overlays) */
.card-elevated {
  background: var(--neutral-0);
  border: 1px solid var(--neutral-200);
  border-radius: 16px;
  padding: 32px;
  
  box-shadow: var(--shadow-xl);
}
```

### Tables (Data-Dense Professional)

```css
.table-wrapper {
  background: var(--neutral-0);
  border: 1px solid var(--neutral-100);
  border-radius: 12px;
  overflow: hidden;
  
  box-shadow: var(--shadow-sm);
}

.table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
}

.table thead {
  background: var(--neutral-50);
  border-bottom: 1px solid var(--neutral-200);
}

.table th {
  padding: 14px 20px;
  text-align: left;
  
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--neutral-600);
  
  white-space: nowrap;
  
  position: sticky;
  top: 0;
  background: var(--neutral-50);
  z-index: 10;
}

.table th.sortable {
  cursor: pointer;
  user-select: none;
}

.table th.sortable:hover {
  color: var(--neutral-900);
}

.table td {
  padding: 16px 20px;
  font-size: 14px;
  color: var(--neutral-700);
  border-bottom: 1px solid var(--neutral-100);
}

.table tbody tr {
  transition: background-color 0.15s ease;
}

.table tbody tr:hover {
  background: var(--neutral-50);
}

.table tbody tr:last-child td {
  border-bottom: none;
}

/* Numeric columns */
.table td.numeric {
  text-align: right;
  font-variant-numeric: tabular-nums;
  font-feature-settings: 'tnum' 1;
}

/* Status badges in tables */
.table .badge {
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
}

.badge-success {
  background: var(--green-100);
  color: var(--green-700);
}

.badge-warning {
  background: var(--yellow-100);
  color: var(--yellow-700);
}

.badge-error {
  background: rgba(239, 68, 68, 0.1);
  color: #DC2626;
}
```

### Navigation (Modern Corporate)

```css
/* Header */
.header {
  position: sticky;
  top: 0;
  z-index: 100;
  
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  
  border-bottom: 1px solid var(--neutral-100);
  
  padding: 0 24px;
  height: 64px;
  
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 32px;
}

.header-nav {
  display: flex;
  align-items: center;
  gap: 4px;
}

.nav-item {
  padding: 8px 16px;
  font-size: 14px;
  font-weight: 500;
  color: var(--neutral-600);
  
  border-radius: 8px;
  transition: all 0.15s ease;
  
  text-decoration: none;
}

.nav-item:hover {
  color: var(--neutral-900);
  background: var(--neutral-100);
}

.nav-item.active {
  color: var(--green-700);
  background: var(--green-50);
  font-weight: 600;
}

/* Sidebar (if needed) */
/* Sidebar - dark glassmorphism */
.sidebar {
  width: 256px; /* w-64 */
  height: 100vh; /* h-screen */
  background: transparent; /* Uses dark background from body */
  backdrop-filter: blur(16px); /* backdrop-blur-md */
  -webkit-backdrop-filter: blur(16px);
  border-left: 1px solid rgba(255, 255, 255, 0.1);
  border-right: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px; /* rounded-2xl */
  padding: 1rem;
  display: flex;
  flex-direction: column;
}

.sidebar-item {
  display: flex;
  align-items: center;
  gap: 1rem; /* gap-4 */
  padding: 0.5rem 1rem; /* py-2 px-4 */
  border-radius: 9999px; /* rounded-full */
  font-size: 0.875rem; /* text-sm */
  font-weight: 500; /* font-medium */
  color: #d4d4d4; /* neutral-300 */
  text-decoration: none;
  transition: all 0.15s ease;
}

.sidebar-item:hover {
  background: rgba(34, 197, 94, 0.16); /* green-100/40 */
  color: white;
  font-weight: 600;
}

.sidebar-item.active {
  background: rgba(255, 255, 255, 0.8); /* white/80 */
  color: black;
  padding-left: 2rem; /* pl-8 */
  position: relative;
  font-weight: 600;
}
```

### Alerts & Notifications (Refined)

```css
/* Inline alert */
.alert {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  
  padding: 16px 20px;
  border-radius: 10px;
  
  font-size: 14px;
  line-height: 1.5;
}

.alert-success {
  background: var(--green-50);
  border-left: 3px solid var(--green-500);
  color: var(--green-900);
}

.alert-warning {
  background: var(--yellow-50);
  border-left: 3px solid var(--yellow-500);
  color: var(--yellow-900);
}

.alert-error {
  background: rgba(239, 68, 68, 0.08);
  border-left: 3px solid var(--status-error);
  color: #991B1B;
}

.alert-info {
  background: rgba(59, 130, 246, 0.08);
  border-left: 3px solid var(--status-info);
  color: #1E40AF;
}

/* Toast notification */
.toast {
  position: fixed;
  bottom: 24px;
  right: 24px;
  
  min-width: 360px;
  max-width: 420px;
  
  background: var(--neutral-0);
  border: 1px solid var(--neutral-200);
  border-radius: 12px;
  
  padding: 16px 20px;
  
  box-shadow: var(--shadow-xl);
  
  display: flex;
  align-items: center;
  gap: 12px;
  
  animation: slideIn 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes slideIn {
  from {
    transform: translateX(400px);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.toast-success { border-left: 3px solid var(--green-500); }
.toast-warning { border-left: 3px solid var(--yellow-500); }
.toast-error { border-left: 3px solid var(--status-error); }
```

---

## Modern Design Patterns

### Glassmorphism (Premium Touch)

```css
.glass {
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
}
```

### Gradient Accents

```css
/* Subtle green gradient */
.gradient-green {
  background: linear-gradient(135deg,
    var(--green-50) 0%,
    var(--green-100) 100%);
}

/* Premium card gradient */
.gradient-card {
  background: linear-gradient(135deg,
    var(--neutral-0) 0%,
    var(--neutral-50) 100%);
}

/* Text gradient (headings) */
.text-gradient {
  background: linear-gradient(135deg,
    var(--green-600) 0%,
    var(--green-500) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
```

### Micro-interactions

```css
/* Smooth transitions */
* {
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
}

/* Scale on hover (cards, buttons) */
.interactive:hover {
  transform: scale(1.02);
}

/* Ripple effect on click */
@keyframes ripple {
  0% {
    transform: scale(0);
    opacity: 1;
  }
  100% {
    transform: scale(4);
    opacity: 0;
  }
}
```

---

## Responsive Design Strategy

### Breakpoints

```css
/* Mobile first approach */
sm: 640px;   /* Mobile landscape, small tablets */
md: 768px;   /* Tablets */
lg: 1024px;  /* Laptops, small desktops */
xl: 1280px;  /* Desktops */
2xl: 1536px; /* Large screens */
```

### Layout Patterns

```html
<!-- Dashboard Grid -->
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  <MetricCard />
  <MetricCard />
  <MetricCard />
</div>

<!-- Two-column layout -->
<div class="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-8">
  <Sidebar />
  <MainContent />
</div>

<!-- Form layout -->
<div class="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
  <FormField />
  <FormField />
</div>
```

---

## Accessibility Standards

### Contrast Requirements

**WCAG AA Minimum:**
- Normal text: 4.5:1
- Large text (18px+): 3:1
- UI components: 3:1

**Our Colors Meet Standards:**
- ✓ Neutral-900 on White: 14:1
- ✓ Neutral-700 on White: 8.5:1
- ✓ Green-700 on White: 4.8:1
- ✓ Yellow-700 on White: 5.2:1

### Focus Indicators

```css
*:focus-visible {
  outline: 2px solid var(--green-500);
  outline-offset: 2px;
  border-radius: 4px;
}

/* Custom focus for inputs */
.input:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.2);
}
```

### Keyboard Navigation

- All interactive elements must be keyboard accessible
- Tab order follows visual hierarchy
- Skip links for complex navigation
- Clear focus states on all components

---

## Loading & Empty States

### Skeleton Loading (Modern)

```css
.skeleton {
  background: linear-gradient(
    90deg,
    var(--neutral-100) 0%,
    var(--neutral-50) 50%,
    var(--neutral-100) 100%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: 6px;
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
```

### Empty States

```html
<div class="empty-state">
  <div class="empty-icon">
    <!-- Illustration or icon -->
  </div>
  <h3 class="empty-title">No hay materiales registrados</h3>
  <p class="empty-description">
    Comienza agregando tu primer material al inventario
  </p>
  <button class="btn-primary">
    Agregar Material
  </button>
</div>
```

```css
.empty-state {
  text-align: center;
  padding: 64px 24px;
}

.empty-icon {
  width: 80px;
  height: 80px;
  margin: 0 auto 24px;
  color: var(--neutral-300);
}

.empty-title {
  font-size: 20px;
  font-weight: 600;
  color: var(--neutral-900);
  margin-bottom: 8px;
}

.empty-description {
  font-size: 15px;
  color: var(--neutral-500);
  margin-bottom: 24px;
  max-width: 400px;
  margin-left: auto;
  margin-right: auto;
}
```

---

## Icon System

### Lucide React (Recommended)

```tsx
import { Package, TrendingUp, AlertTriangle, Check } from 'lucide-react';

// Standard size
<Package size={20} strokeWidth={2} />

// In buttons
<button className="btn-primary">
  <Check size={18} />
  Guardar
</button>

// Status icons
<AlertTriangle size={20} className="text-yellow-500" />
```

**Icon Guidelines:**
- Use 20px for standard UI
- Use 24px for headers
- Use 16px for inline text
- Stroke width: 2px standard, 1.5px for lighter feel
- Always pair with text labels (don't rely on icons alone)
- Consistent color with surrounding text

---

## Animation Principles

### Timing Functions

```css
/* Default smooth */
ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);

/* Snappy interactions */
ease-out: cubic-bezier(0, 0, 0.2, 1);

/* Bouncy (use sparingly) */
spring: cubic-bezier(0.68, -0.55, 0.27, 1.55);
```

### Duration Guidelines

```css
--duration-fast: 150ms;    /* Hover, focus */
--duration-base: 200ms;    /* Standard transitions */
--duration-slow: 300ms;    /* Complex animations */
--duration-slower: 500ms;  /* Page transitions */
```

### Animation Rules

- **Prefer transforms over position changes** (better performance)
- **Use opacity for fade effects**
- **Keep animations under 300ms** (feels responsive)
- **Reduce motion for accessibility** (prefers-reduced-motion)

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## Premium UI Checklist

Before approving any screen:

**Visual Hierarchy**
- [ ] Clear primary action (green button)
- [ ] Logical heading structure (h1 → h2 → h3)
- [ ] Proper text contrast (4.5:1 minimum)
- [ ] Adequate white space (not cramped)

**Typography**
- [ ] Consistent font weights
- [ ] Appropriate font sizes (14px minimum)
- [ ] Line heights for readability (1.5 body, 1.2 headings)
- [ ] Tabular numbers for data

**Color**
- [ ] Green for primary actions only
- [ ] Yellow for warnings/attention
- [ ] Neutrals for hierarchy
- [ ] Status colors used correctly

**Spacing**
- [ ] 8px grid alignment
- [ ] Consistent padding (16px, 24px, 32px)
- [ ] Breathing room around elements
- [ ] Balanced composition

**Interaction**
- [ ] Clear hover states
- [ ] Visible focus indicators
- [ ] Loading states defined
- [ ] Error states handled

**Accessibility**
- [ ] Keyboard navigable
- [ ] Screen reader friendly
- [ ] Sufficient contrast
- [ ] Touch targets 44x44px minimum

**Polish**
- [ ] Subtle shadows (not heavy)
- [ ] Smooth transitions (150-200ms)
- [ ] Rounded corners (8-12px)
- [ ] Professional feel overall

---

## Implementation with Tailwind

### Using shadcn/ui Tokens

The application uses shadcn/ui's CSS variable tokens for theming. All colors are referenced via the `var(--token)` naming convention. In Tailwind, these tokens are automatically available as `bg-primary`, `text-foreground`, `border-border`, etc.

**No custom color extension is needed** because the tokens are defined in `src/app/globals.css`. The only required Tailwind configuration is to ensure the CSS file is imported (which it is in `globals.css`).

```js
// tailwind.config.js (minimal)
module.exports = {
  content: [
    // Your content paths
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
};
```

### Example Component Usage

```tsx
// Primary button using tokens
<button className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary text-primary-foreground font-semibold text-[15px] rounded-lg shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
  <Check size={18} />
  Guardar Cambios
</button>

// Card using tokens
<div className="bg-card border border-border rounded-xl p-6 shadow-sm">
  <h3 className="text-lg font-semibold text-foreground mb-2">Card Title</h3>
  <p className="text-muted-foreground">Card content goes here.</p>
</div>
```

---

## Final Principle

**Create interfaces that professionals trust.**

Every pixel should communicate:
- **Competence** through refined typography and spacing
- **Reliability** through consistent patterns and clear hierarchy
- **Efficiency** through thoughtful information architecture
- **Quality** through subtle details and smooth interactions

**This is enterprise software for professionals. Design accordingly.**

---

**Sistema de Producción de Bloques Premium Design System**
*Version 2.0 - Corporate Grade*