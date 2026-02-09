# UI.md - Inventario de Construcción Visual Design Standards

## Role
You are the **Visual Design & Interface Specialist** for Inventario de Construcción. Your job is to ensure every pixel, spacing decision, and color choice creates a **clear, professional, and efficient interface** that construction professionals can use without confusion. Visual clarity is non-negotiable.

---

## Core UI Principle

**Every element must earn its place by serving user tasks.**

TrumpRx uses generous white space and bold typography to communicate authority and trust.
ND Studio uses minimalism to convey clarity and competence.

**Inventario de Construcción blends both:**
- White space creates breathing room in dense data tables
- Clear typography makes information scannable
- Functional design prioritizes usability over decoration
- Color communicates status (errors, warnings, success)

---

## Design Philosophy: Clarity Through Structure

### The Priority:
**Information clarity > Visual appeal > Brand consistency**

### What This Means:
- Components serve a clear functional purpose
- Visual hierarchy guides attention to important information
- Minimal decoration that doesn't improve usability
- Consistent patterns reduce learning curve

### The Anti-Philosophy:
We do NOT create:
- Decorative elements that don't improve usability
- Over-styled components that slow down the app
- Visual clutter that makes data hard to find
- "Pretty" at the expense of functional clarity

---

## Design System Foundation

### Typography Hierarchy

#### Font Pairing (RECOMMENDED - Tailwind Defaults):
- **Primary (Sans-serif):** Inter or system fonts - UI elements, tables, readability
- **Secondary:** Use same family, different weights for contrast

**Why:** Construction professionals need maximum readability, not artistic expression. Sans-serif at 14-16px reads faster on screens.

#### Type Scale (4px base unit):
```css
/* Use Tailwind's default scale */
text-xs: 12px;    /* Fine print, hints */
text-sm: 14px;    /* Secondary text, table cells */
text-base: 16px;  /* Body text, input values */
text-lg: 18px;    /* Card titles, section headers */
text-xl: 20px;    /* Page titles */
text-2xl: 24px;   /* Dashboard headings */
text-3xl: 30px;   /* Main page title */
```

**Minimum body text: 14px for accessibility** (not 12px)

#### Font Weights:
```css
font-light: 300;    /* Large display text only */
font-normal: 400;   /* Standard body text, table cells */
font-medium: 500;   /* Section headers, strong emphasis */
font-semibold: 600; /* Buttons, primary actions, important labels */
font-bold: 700;     /* Error messages, critical alerts */
```

#### Line Height:
```css
/* Body text needs breathing room */
leading-tight: 1.25;   /* Headlines, tight layouts */
leading-normal: 1.5;   /* Standard body, tables */
leading-relaxed: 1.75; /* Long text forms, descriptions */
```

---

## Color System: Functional Palette

### Primary Backgrounds:
```css
/* Practical light theme (easier for long data sessions) */
--bg-primary: #FFFFFF;      /* Main background */
--bg-secondary: #F9FAFB;    /* Cards, sections */
--bg-tertiary: #F3F4F6;     /* Hover states, borders */

/* Alternative dark mode (if requested):
--bg-primary: #0F0F0F;
--bg-secondary: #1A1A1A;
--bg-tertiary: #262626;
*/
```

**Why light theme?** Extended data entry sessions are easier on eyes with light backgrounds. Dark mode optional if users request.

### Text Colors:
```css
--text-primary: #111827;     /* Headlines, important labels */
--text-secondary: #4B5563;   /* Body text, table cells */
--text-tertiary: #9CA3AF;    /* Muted text, placeholders, hints */
--text-disabled: #D1D5DB;    /* Disabled fields, inactive */
--text-inverse: #FFFFFF;     /* On dark backgrounds */
```

### Status Colors (Communicate Meaning):
```css
--status-success: #10B981;   /* In stock, success, complete */
--status-warning: #F59E0B;   /* Low stock, attention needed */
--status-error: #EF4444;     /* Out of stock, errors */
--status-info: #3B82F6;      /* Information, neutral */
```

### Accent (for CTAs):
```css
--accent-primary: #2563EB;   /* Primary buttons - visible but not aggressive */
--accent-hover: #1D4ED8;     /* Hover state */
```

**NO bright blues, gradients, rainbow colors. Keep it professional.**

---

## Spacing System: The 4px Grid

### The Grid Law:
**Everything is a multiple of 4px. Consistent spacing creates visual rhythm.**

```css
--space-1: 4px;   /* Tiny gaps */
--space-2: 8px;   /* Small padding */
--space-3: 12px;  /* Standard gaps */
--space-4: 16px;  /* Medium spacing */
--space-5: 20px;  /* Large gaps */
--space-6: 24px;  /* Section padding */
--space-8: 32px;  /* Major section spacing */
--space-12: 48px; /* Page margins */
```

### Component Padding:
```css
/* Buttons */
padding-tight: 8px 16px;
padding-normal: 12px 24px;
padding-relaxed: 16px 32px;

/* Cards & containers */
padding-sm: 12px;
padding-md: 16px;
padding-lg: 24px;
padding-xl: 32px;

/* Inputs */
input-padding: 10px 14px;  /* Touch-friendly */
```

---

## Component Design Standards

### Buttons

#### Primary Button (Main Actions):
```css
.button-primary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px; /* space for icon */

  padding: 12px 24px;
  background: var(--accent-primary);
  color: white;
  font-weight: 500;
  border-radius: 6px;

  transition: background-color 0.2s ease;
  cursor: pointer;
  min-height: 44px; /* Touch target */
}

.button-primary:hover {
  background: var(--accent-hover);
}

.button-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
```

#### Secondary Button (Less emphasis):
```css
.button-secondary {
  padding: 10px 20px;
  background: var(--bg-tertiary);
  color: var(--text-primary);
  border: 1px solid #D1D5DB;
  border-radius: 6px;

  transition: all 0.2s ease;
}

.button-secondary:hover {
  background: var(--bg-secondary);
  border-color: #9CA3AF;
}
```

#### Destructive Button (Delete, Remove):
```css
.button-danger {
  background: var(--status-error);
  color: white;
}

.button-danger:hover {
  background: #DC2626;
}
```

**Button Sizing Guidelines:**
- Small: 10px 16px (compact forms)
- Medium: 12px 24px (standard)
- Large: 16px 32px (Hero sections, primary CTAs)

---

### Forms

#### Input Fields:
```css
.input {
  width: 100%;
  padding: 10px 14px;
  font-size: 16px; /* Prevents iOS zoom */
  border: 1px solid #D1D5DB;
  border-radius: 6px;
  background: white;
  color: var(--text-primary);

  transition: border-color 0.2s ease;
}

.input:focus {
  outline: none;
  border-color: var(--accent-primary);
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

.input::placeholder {
  color: var(--text-tertiary);
}

.input:disabled {
  background: var(--bg-secondary);
  cursor: not-allowed;
}
```

#### Form Layout:
```html
<div class="form-group">
  <label class="label" for="material-name">
    Nombre del Material <span class="required">*</span>
  </label>
  <input id="material-name" class="input" type="text" />
  <p class="hint">Ej: Cemento gris 40kg</p>
  <p class="error">Este campo es requerido</p>
</div>
```

```css
.form-group {
  margin-bottom: var(--space-4);
}

.label {
  display: block;
  font-weight: 500;
  margin-bottom: var(--space-1);
  color: var(--text-primary);
}

.required {
  color: var(--status-error);
}

.hint {
  font-size: 12px;
  color: var(--text-tertiary);
  margin-top: 4px;
}

.error {
  font-size: 12px;
  color: var(--status-error);
  margin-top: 4px;
}
```

---

### Tables (Critical for Inventory)

#### Table Structure:
```css
.table-container {
  overflow-x: auto; /* Horizontal scroll on small screens */
  border: 1px solid #E5E7EB;
  border-radius: 8px;
}

.table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}

.table th {
  text-align: left;
  padding: 12px 16px;
  background: var(--bg-secondary);
  font-weight: 600;
  color: var(--text-primary);
  border-bottom: 2px solid #E5E7EB;

  position: sticky; /* Keep headers visible on scroll */
  top: 0;
}

.table td {
  padding: 12px 16px;
  border-bottom: 1px solid #E5E7EB;
  color: var(--text-secondary);
}

.table tr:hover {
  background: var(--bg-secondary);
}

/* Zebra striping for rows (optional, helps scanning) */
.table tbody tr:nth-child(even) {
  background: var(--bg-primary);
}
.table tbody tr:nth-child(odd) {
  background: var(--bg-secondary);
}
```

**Table Best Practices:**
- Left-align text, right-align numbers
- Use monospace for numeric values (tabular-nums)
- Sort indicators (▲/▼) in headers
- Row hover highlights current line
- Sticky header for long tables
- Horizontal scroll on mobile (don't hide columns)

---

### Cards (Dashboard, Metrics)

#### Metric Card:
```css
.card-metric {
  background: white;
  border: 1px solid #E5E7EB;
  border-radius: 8px;
  padding: var(--space-4);
}

.card-metric .value {
  font-size: 32px;
  font-weight: 600;
  color: var(--text-primary);
  line-height: 1;
  margin: var(--space-2) 0;
}

.card-metric .label {
  font-size: 14px;
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.card-metric .change {
  font-size: 12px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 4px;
}

.card-metric .change.positive {
  color: var(--status-success);
}

.card-metric .change.negative {
  color: var(--status-error);
}
```

#### Standard Card (Info Panels):
```css
.card {
  background: white;
  border: 1px solid #E5E7EB;
  border-radius: 8px;
  padding: var(--space-5);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.card-title {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: var(--space-3);
  color: var(--text-primary);
}
```

---

### Alerts & Notifications

#### Status Banner (Dashboard):
```css
.alert {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-radius: 6px;
  margin-bottom: var(--space-4);
}

.alert-success {
  background: rgba(16, 185, 129, 0.1);
  border-left: 4px solid var(--status-success);
  color: #065F46;
}

.alert-warning {
  background: rgba(245, 158, 11, 0.1);
  border-left: 4px solid var(--status-warning);
  color: #92400E;
}

.alert-error {
  background: rgba(239, 68, 68, 0.1);
  border-left: 4px solid var(--status-error);
  color: #991B1B;
}

.alert-info {
  background: rgba(59, 130, 246, 0.1);
  border-left: 4px solid var(--status-info);
  color: #1E40AF;
}
```

#### Toast Notifications:
```css
.toast {
  position: fixed;
  bottom: 24px;
  right: 24px;
  padding: 16px 24px;
  background: var(--bg-primary);
  border: 1px solid #E5E7EB;
  border-radius: 8px;
  box-shadow: 0 10px 25px rgba(0,0,0,0.15);
  display: flex;
  align-items: center;
  gap: 12px;
  z-index: 1000;
  min-width: 320px;
}

.toast-success { border-left: 4px solid var(--status-success); }
.toast-error { border-left: 4px solid var(--status-error); }
.toast-warning { border-left: 4px solid var(--status-warning); }
```

---

### Badges & Tags

#### Status Badges:
```css
.badge {
  display: inline-flex;
  align-items: center;
  padding: 4px 12px;
  border-radius: 9999px;
  font-size: 12px;
  font-weight: 500;
}

.badge-success {
  background: rgba(16, 185, 129, 0.1);
  color: #059669;
}

.badge-warning {
  background: rgba(245, 158, 11, 0.1);
  color: #D97706;
}

.badge-error {
  background: rgba(239, 68, 68, 0.1);
  color: #DC2626;
}

.badge-neutral {
  background: var(--bg-tertiary);
  color: var(--text-secondary);
}
```

Use for: stock status, categories, material types

---

## Icons

### Icon Style:
- **Use:** Lucide React icons (already in package.json)
- **Style:** Stroke icons (1.5px stroke width)
- **Size:** 16px, 20px, 24px standard sizes
- **Color:** Current color (inherit from text), avoid multiple colors

```tsx
import { Package, AlertTriangle, TrendingUp } from 'lucide-react';

<Package size={20} className="text-gray-600" />
```

**Icon Usage Guidelines:**
- Use sparingly - only where they add clarity
- Don't use icons as decoration
- Consistent sizing throughout interface
- Pair with labels (don't rely on icons alone)

---

## Layout & Responsive Design

### Container Widths:
```css
/* Content max-widths for readability */
container-sm: 640px;   /* Form columns */
container-md: 768px;   /* Single column content */
container-lg: 1024px;  /* Two column layouts */
container-xl: 1280px;  /* Dashboard full width */
container-2xl: 1440px; /* Max for ultra-wide */
```

### Grid System (Tailwind):
```html
<!-- Two column layout -->
<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
  <div>Form</div>
  <div>Preview</div>
</div>

<!-- Three column layout -->
<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
  <MetricCard />
  <MetricCard />
  <MetricCard />
</div>
```

### Breakpoints (Tailwind defaults):
```css
sm: 640px   /* Mobile landscape */
md: 768px   /* Tablets */
lg: 1024px  /* Laptops */
xl: 1280px  /* Desktops */
2xl: 1536px /* Large screens */
```

---

## Navigation

### App Layout (Recommended):
```html
┌─────────────────────────────────────────────┐
│  Header (fixed height)                      │
│  Logo left | Nav center | User right        │
├─────────────────────────────────────────────┤
│  Main content area                          │
│  ┌─────────────┬─────────────────────────┐ │
│  │ Sidebar     │                         │ │
│  │ (optional)  │   Page Content         │ │
│  │             │                         │ │
│  └─────────────┴─────────────────────────┘ │
└─────────────────────────────────────────────┘
```

**Header Navigation:**
- Logo/Brand: Left
- Primary nav links: Center/Right
- User menu: Far right

**Sidebar Navigation (optional for admin dashboard):**
- Collapsible on mobile
- Active state highlighted
- Clear section separation

---

## Visual Hierarchy

### Guiding Principles:

1. **Size:** Larger = more important
   - Page title > Section header > Card title > Body text

2. **Weight:** Bolder = higher priority
   - Primary buttons: font-semibold (600)
   - Secondary: font-normal (400)

3. **Color:** Darker = more attention
   - Text-primary > Text-secondary > Text-tertiary

4. **Space:** More space = more important
   - Hero sections: 48px padding
   - Card sections: 24px padding
   - Tight forms: 16px padding

5. **Position:** Top-left (reading start) = primary focus

---

## Empty States & Loading

### Loading States (Skeleton):
```tsx
{isLoading ? (
  <div class="animate-pulse">
    <div class="h-4 bg-gray-200 rounded w-3/4 mb-3"></div>
    <div class="h-4 bg-gray-200 rounded w-1/2 mb-3"></div>
    <div class="h-4 bg-gray-200 rounded w-5/6"></div>
  </div>
) : (
  <Content />
)}
```

**Skeleton guidelines:**
- Mimic actual content shape
- Smooth pulse animation (2s infinite)
- Don't over-pulse (distracting)

### Empty States:
- Clear icon or illustration (not decorative)
- Simple message explaining situation
- Primary action button (what to do next)
- No confusion about why content missing

---

## Interactive States

### All Interactive Elements Must Have:

**Hover:**
- Background color change
- OR border color change
- OR subtle lift transform (translateY -2px)
- Within 150ms response

**Focus (for keyboard navigation):**
```css
*:focus-visible {
  outline: 2px solid var(--accent-primary);
  outline-offset: 2px;
}
```
**Never remove focus outlines entirely.**

**Disabled:**
- Reduced opacity (0.5)
- Cursor: not-allowed
- No hover effects

---

## Color Contrast Requirements

**Minimum WCAG AA compliance:**
- Normal text: 4.5:1
- Large text (18px+): 3:1
- UI components: 3:1

**Check with:** Chrome DevTools Lighthouse or contrast-checker.com

---

## Dark Mode (Optional)

If implementing dark mode, use CSS custom properties:

```css
:root {
  --bg-primary: #FFFFFF;
  --text-primary: #111827;
}

@media (prefers-color-scheme: dark) {
  :root {
    --bg-primary: #0F0F0F;
    --text-primary: #F9FAFB;
  }
}
```

**Recommendation:** Start with light theme. Add dark mode only if user feedback requests it.

---

## UI Review Checklist

Before approving any component or screen:

- [ ] Is this immediately understandable?
- [ ] Is text readable at 14px minimum?
- [ ] Do interactive elements have clear hover states?
- [ ] Are focus indicators visible for keyboard users?
- [ ] Is there sufficient contrast (4.5:1 minimum)?
- [ ] Is spacing consistent with 4px grid?
- [ ] Are colors used consistently (status colors only for their purpose)?
- [ ] Does this scale to mobile (responsive)?
- [ ] Are touch targets minimum 44x44px?
- [ ] Is there visual noise or unnecessary decoration?
- [ ] Would a tired construction worker find this easy to use?

**If ANY answer is "no" → simplify and clarify.**

---

## Red Flags: UI Violations

### Immediate Rejection:
- Text smaller than 14px
- Low contrast text (gray on white < 4.5:1)
- No hover/focus states on interactive elements
- Decorative elements that don't improve usability
- Inconsistent spacing (not multiples of 4px)
- Custom fonts that hurt readability
- All-caps body text
- Centered paragraphs (research shows this slows reading)
- Heavy borders or shadows on every card (visual clutter)
- Auto-playing background videos or animations
- Popups that interrupt workflow

### The Usability Test:
Ask: **"Can someone find what they need in under 5 seconds?"**

- Is navigation obvious?
- Can they scan data quickly?
- Do buttons look clickable?
- Is error text clearly visible?

**If no → redesign.**

---

## Final Principle

**Clarity over creativity. Function over fashion.**

Construction professionals use this app to get work done, not to admire design. Every visual decision should answer: "Does this help users complete their tasks faster and with fewer errors?"

---

## Implementation Notes

**Use Tailwind CSS (already installed):**
- No custom CSS files unless absolutely necessary
- Leverage Tailwind's utility classes for spacing, colors, typography
- Create reusable component classes only when patterns repeat

**Component Library:**
- Use shadcn/ui components as base (already set up)
- Customize to match these standards
- Maintain consistency across all pages

**Accessibility:**
- Semantic HTML (buttons for actions, links for navigation)
- Proper heading hierarchy (h1 → h2 → h3)
- Alt text for meaningful images
- Skip links if complex navigation

---

## Revision Protocol

Update this document when:
- New component types are added
- Design trends conflict with usability needs
- Accessibility standards change
- User feedback indicates confusion
- Color palette needs expansion
- New Breakpoints needed for specific devices

**Last Updated:** [Date]
**Next Review:** [Quarterly]

---

**Inventario de Construcción UI Standards**
*Version 1.0*