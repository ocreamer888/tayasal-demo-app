# SHADCN_MASTERY.md - shadcn/ui God-Tier Implementation Guide

## Role
You are the **shadcn/ui Master Architect**. You possess deep expertise in leveraging shadcn/ui components to create **production-grade, enterprise-level interfaces** that are beautiful, accessible, and performant. You don't just use shadcn — you **master it**, customize it, and elevate it to create interfaces that rival the best SaaS products.

---

## Core Philosophy

**shadcn/ui is not a component library — it's a component system you own.**

Unlike traditional libraries, shadcn components live in YOUR codebase. This means:
- ✅ **Full customization control** - modify any component to exact specs
- ✅ **No bundle bloat** - only include components you use
- ✅ **No version conflicts** - you control updates
- ✅ **Complete ownership** - components are yours to evolve

**Your Mission:** Use shadcn as the foundation, then elevate it with premium design patterns, custom variants, and sophisticated compositions.

---

## shadcn/ui Fundamentals

### What is shadcn/ui?

shadcn/ui is a **component system** built on:
- **Radix UI** - Unstyled, accessible primitives
- **Tailwind CSS** - Utility-first styling
- **class-variance-authority (CVA)** - Variant management
- **tailwind-merge** - Class conflict resolution

### Installation & Setup

```bash
# Initialize shadcn in your project
npx shadcn-ui@latest init

# Configuration options:
# - TypeScript: Yes
# - Style: Default
# - Base color: Neutral/Slate
# - CSS variables: Yes
# - Tailwind config: Yes
```

### File Structure After Init

```
src/
├── components/
│   └── ui/           # shadcn components live here
│       ├── button.tsx
│       ├── card.tsx
│       ├── input.tsx
│       └── ...
├── lib/
│   └── utils.ts      # cn() helper function
└── ...
```

---

## The cn() Utility - Your Best Friend

```typescript
// lib/utils.ts
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

**Why it's powerful:**
- Combines multiple className strings
- Resolves Tailwind conflicts (later classes win)
- Handles conditional classes elegantly

```tsx
// Example usage
<Button 
  className={cn(
    "base-styles",
    isActive && "active-styles",
    isDisabled && "disabled-styles",
    className // Allow external overrides
  )}
/>
```

---

## Component Installation Strategy

### Install Components Strategically

```bash
# Core components (install first)
npx shadcn-ui@latest add button
npx shadcn-ui@latest add input
npx shadcn-ui@latest add card
npx shadcn-ui@latest add label
npx shadcn-ui@latest add select
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add dropdown-menu

# Data display
npx shadcn-ui@latest add table
npx shadcn-ui@latest add badge
npx shadcn-ui@latest add separator
npx shadcn-ui@latest add avatar

# Forms
npx shadcn-ui@latest add form
npx shadcn-ui@latest add checkbox
npx shadcn-ui@latest add radio-group
npx shadcn-ui@latest add switch
npx shadcn-ui@latest add textarea
npx shadcn-ui@latest add calendar
npx shadcn-ui@latest add popover

# Feedback
npx shadcn-ui@latest add alert
npx shadcn-ui@latest add toast
npx shadcn-ui@latest add alert-dialog
npx shadcn-ui@latest add progress
npx shadcn-ui@latest add skeleton

# Navigation
npx shadcn-ui@latest add tabs
npx shadcn-ui@latest add navigation-menu
npx shadcn-ui@latest add command
npx shadcn-ui@latest add sheet

# Advanced
npx shadcn-ui@latest add data-table
npx shadcn-ui@latest add combobox
npx shadcn-ui@latest add date-picker
```

**Pro Tip:** Install as needed, not all at once. Keep your codebase lean.

---

## Customizing shadcn Components for Sistema de Producción

### Step 1: Configure Theme Colors

```typescript
// tailwind.config.ts
import type { Config } from "tailwindcss"

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/**/*.{ts,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // Custom colors for Sistema de Producción
        green: {
          50: '#F0FDF4',
          100: '#DCFCE7',
          500: '#22C55E',
          600: '#16A34A',
          700: '#15803D',
          900: '#14532D',
        },
        yellow: {
          50: '#FEFCE8',
          100: '#FEF9C3',
          400: '#FACC15',
          500: '#EAB308',
          600: '#CA8A04',
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}

export default config
```

### Step 2: Set CSS Variables

```css
/* src/app/globals.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    /* Background colors */
    --background: 0 0% 100%;        /* White */
    --foreground: 0 0% 9%;          /* Near black */

    /* Card colors */
    --card: 0 0% 100%;              /* White */
    --card-foreground: 0 0% 9%;     /* Near black */

    /* Popover colors */
    --popover: 0 0% 100%;
    --popover-foreground: 0 0% 9%;

    /* Primary (Green) */
    --primary: 142 71% 45%;         /* Green-500 */
    --primary-foreground: 0 0% 100%; /* White */

    /* Secondary (Neutral) */
    --secondary: 0 0% 96%;          /* Neutral-50 */
    --secondary-foreground: 0 0% 9%; /* Neutral-900 */

    /* Muted (Subtle backgrounds) */
    --muted: 0 0% 96%;              /* Neutral-50 */
    --muted-foreground: 0 0% 45%;   /* Neutral-500 */

    /* Accent (Yellow) */
    --accent: 48 96% 53%;           /* Yellow-400 */
    --accent-foreground: 0 0% 9%;   /* Near black */

    /* Destructive (Red) */
    --destructive: 0 84% 60%;       /* Red-500 */
    --destructive-foreground: 0 0% 100%;

    /* Border & Input */
    --border: 0 0% 90%;             /* Neutral-200 */
    --input: 0 0% 90%;              /* Neutral-200 */
    --ring: 142 71% 45%;            /* Green-500 */

    /* Border radius */
    --radius: 0.5rem;               /* 8px */
  }

  .dark {
    --background: 0 0% 4%;          /* Neutral-950 */
    --foreground: 0 0% 98%;         /* Neutral-50 */
    
    --card: 0 0% 6%;
    --card-foreground: 0 0% 98%;
    
    --popover: 0 0% 6%;
    --popover-foreground: 0 0% 98%;
    
    --primary: 142 71% 45%;
    --primary-foreground: 0 0% 100%;
    
    --secondary: 0 0% 10%;
    --secondary-foreground: 0 0% 98%;
    
    --muted: 0 0% 10%;
    --muted-foreground: 0 0% 64%;
    
    --accent: 48 96% 53%;
    --accent-foreground: 0 0% 9%;
    
    --destructive: 0 84% 60%;
    --destructive-foreground: 0 0% 100%;
    
    --border: 0 0% 15%;
    --input: 0 0% 15%;
    --ring: 142 71% 45%;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
    font-feature-settings: "rlig" 1, "calt" 1;
  }
}
```

---

## Mastering Core Components

### Button Component - Premium Customization

```tsx
// components/ui/button.tsx
import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { Loader2 } from "lucide-react"

const buttonVariants = cva(
  // Base styles - applied to all variants
  "inline-flex items-center justify-center gap-2 rounded-lg text-sm font-semibold ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: 
          "bg-gradient-to-b from-green-500 to-green-600 text-white shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0",
        destructive:
          "bg-gradient-to-b from-red-500 to-red-600 text-white shadow-sm hover:shadow-md hover:-translate-y-0.5",
        outline:
          "border-2 border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: 
          "hover:bg-accent hover:text-accent-foreground",
        link: 
          "text-primary underline-offset-4 hover:underline",
        warning:
          "bg-gradient-to-b from-yellow-400 to-yellow-500 text-neutral-900 shadow-sm hover:shadow-md hover:-translate-y-0.5",
        success:
          "bg-green-50 text-green-700 border border-green-200 hover:bg-green-100",
      },
      size: {
        default: "h-11 px-6 py-2.5",
        sm: "h-9 rounded-md px-4 text-xs",
        lg: "h-12 rounded-lg px-8 text-base",
        xl: "h-14 rounded-xl px-10 text-lg",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  isLoading?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, isLoading, children, disabled, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
        {children}
      </Comp>
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
```

**Usage Examples:**

```tsx
import { Button } from "@/components/ui/button"
import { Plus, Save, Trash2 } from "lucide-react"

// Primary action
<Button>
  <Plus className="h-4 w-4" />
  Nuevo Material
</Button>

// Warning action
<Button variant="warning">
  <Save className="h-4 w-4" />
  Actualizar
</Button>

// Destructive action
<Button variant="destructive">
  <Trash2 className="h-4 w-4" />
  Eliminar
</Button>

// Loading state
<Button isLoading disabled>
  Guardando...
</Button>

// Ghost button
<Button variant="ghost" size="sm">
  Cancelar
</Button>

// Icon only
<Button variant="outline" size="icon">
  <Plus className="h-4 w-4" />
</Button>
```

---

### Card Component - Enhanced Version

```tsx
// components/ui/card.tsx
import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const cardVariants = cva(
  "rounded-xl border bg-card text-card-foreground shadow-sm transition-all duration-200",
  {
    variants: {
      variant: {
        default: "border-border",
        elevated: "shadow-lg hover:shadow-xl",
        interactive: "hover:border-primary/50 hover:shadow-md hover:-translate-y-1 cursor-pointer",
        success: "border-green-200 bg-gradient-to-br from-white to-green-50",
        warning: "border-yellow-200 bg-gradient-to-br from-white to-yellow-50",
        glass: "bg-white/70 backdrop-blur-md border-white/30",
      },
      padding: {
        none: "p-0",
        sm: "p-4",
        default: "p-6",
        lg: "p-8",
      },
    },
    defaultVariants: {
      variant: "default",
      padding: "default",
    },
  }
)

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, padding, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(cardVariants({ variant, padding, className }))}
      {...props}
    />
  )
)
Card.displayName = "Card"

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5", className)}
    {...props}
  />
))
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-lg font-semibold leading-none tracking-tight text-foreground",
      className
    )}
    {...props}
  />
))
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("pt-0", className)} {...props} />
))
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center pt-0", className)}
    {...props}
  />
))
CardFooter.displayName = "CardFooter"

export { 
  Card, 
  CardHeader, 
  CardFooter, 
  CardTitle, 
  CardDescription, 
  CardContent,
  cardVariants 
}
```

**Usage Examples:**

```tsx
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Package } from "lucide-react"

// Basic card
<Card>
  <CardHeader>
    <CardTitle>Materiales en Inventario</CardTitle>
    <CardDescription>Gestiona tus materiales de construcción</CardDescription>
  </CardHeader>
  <CardContent>
    {/* Content */}
  </CardContent>
</Card>

// Success metric card
<Card variant="success" className="relative overflow-hidden">
  <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-green-500 to-green-600" />
  <CardHeader>
    <div className="flex items-center justify-between">
      <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        Total Producido
      </CardTitle>
      <Package className="h-4 w-4 text-muted-foreground" />
    </div>
  </CardHeader>
  <CardContent>
    <div className="text-3xl font-bold tabular-nums">12,450</div>
    <p className="text-xs text-green-600 font-semibold mt-1">
      +12.5% vs mes anterior
    </p>
  </CardContent>
</Card>

// Interactive card
<Card variant="interactive">
  <CardHeader>
    <CardTitle>Orden #1234</CardTitle>
    <CardDescription>Bloques 15x20x40 - Cemento gris</CardDescription>
  </CardHeader>
  <CardContent>
    <div className="text-sm">
      <p className="font-medium">Estado: En producción</p>
      <p className="text-muted-foreground">Fecha: 09/02/2026</p>
    </div>
  </CardContent>
</Card>

// Glass card
<Card variant="glass" className="backdrop-blur-xl">
  <CardHeader>
    <CardTitle>Estadísticas del día</CardTitle>
  </CardHeader>
  <CardContent>
    {/* Translucent overlay effect */}
  </CardContent>
</Card>
```

---

### Input Component - Enhanced with Icons

```tsx
// components/ui/input.tsx
import * as React from "react"
import { cn } from "@/lib/utils"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode
  error?: string
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, icon, error, ...props }, ref) => {
    return (
      <div className="relative w-full">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            {icon}
          </div>
        )}
        <input
          type={type}
          className={cn(
            "flex h-11 w-full rounded-lg border border-input bg-background px-4 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200",
            icon && "pl-10",
            error && "border-destructive focus-visible:ring-destructive",
            className
          )}
          ref={ref}
          {...props}
        />
        {error && (
          <p className="mt-1.5 text-xs text-destructive font-medium">{error}</p>
        )}
      </div>
    )
  }
)
Input.displayName = "Input"

export { Input }
```

**Usage:**

```tsx
import { Input } from "@/components/ui/input"
import { Search, Package, DollarSign } from "lucide-react"

// With icon
<Input 
  icon={<Search className="h-4 w-4" />}
  placeholder="Buscar materiales..."
/>

// With error
<Input 
  icon={<Package className="h-4 w-4" />}
  error="Este campo es requerido"
  placeholder="Nombre del material"
/>

// Number input
<Input 
  type="number"
  icon={<DollarSign className="h-4 w-4" />}
  placeholder="0.00"
  step="0.01"
/>
```

---

### Table Component - Production Ready

```tsx
// components/ui/table.tsx
import * as React from "react"
import { cn } from "@/lib/utils"

const Table = React.forwardRef<
  HTMLTableElement,
  React.HTMLAttributes<HTMLTableElement>
>(({ className, ...props }, ref) => (
  <div className="relative w-full overflow-auto rounded-xl border border-border shadow-sm">
    <table
      ref={ref}
      className={cn("w-full caption-bottom text-sm", className)}
      {...props}
    />
  </div>
))
Table.displayName = "Table"

const TableHeader = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <thead 
    ref={ref} 
    className={cn(
      "bg-muted/50 border-b border-border",
      className
    )} 
    {...props} 
  />
))
TableHeader.displayName = "TableHeader"

const TableBody = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tbody
    ref={ref}
    className={cn("[&_tr:last-child]:border-0", className)}
    {...props}
  />
))
TableBody.displayName = "TableBody"

const TableFooter = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tfoot
    ref={ref}
    className={cn(
      "border-t bg-muted/50 font-medium [&>tr]:last:border-b-0",
      className
    )}
    {...props}
  />
))
TableFooter.displayName = "TableFooter"

const TableRow = React.forwardRef<
  HTMLTableRowElement,
  React.HTMLAttributes<HTMLTableRowElement>
>(({ className, ...props }, ref) => (
  <tr
    ref={ref}
    className={cn(
      "border-b border-border transition-colors hover:bg-muted/30 data-[state=selected]:bg-muted",
      className
    )}
    {...props}
  />
))
TableRow.displayName = "TableRow"

const TableHead = React.forwardRef<
  HTMLTableCellElement,
  React.ThHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <th
    ref={ref}
    className={cn(
      "h-12 px-4 text-left align-middle font-semibold text-xs uppercase tracking-wider text-muted-foreground [&:has([role=checkbox])]:pr-0",
      className
    )}
    {...props}
  />
))
TableHead.displayName = "TableHead"

const TableCell = React.forwardRef<
  HTMLTableCellElement,
  React.TdHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <td
    ref={ref}
    className={cn(
      "p-4 align-middle [&:has([role=checkbox])]:pr-0",
      className
    )}
    {...props}
  />
))
TableCell.displayName = "TableCell"

const TableCaption = React.forwardRef<
  HTMLTableCaptionElement,
  React.HTMLAttributes<HTMLTableCaptionElement>
>(({ className, ...props }, ref) => (
  <caption
    ref={ref}
    className={cn("mt-4 text-sm text-muted-foreground", className)}
    {...props}
  />
))
TableCaption.displayName = "TableCaption"

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
}
```

**Usage Example:**

```tsx
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

const materials = [
  { id: 1, name: "Cemento gris 40kg", stock: 150, min: 100, status: "ok" },
  { id: 2, name: "Arena fina", stock: 45, min: 50, status: "low" },
  { id: 3, name: "Grava 3/4", stock: 0, min: 30, status: "out" },
]

<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Material</TableHead>
      <TableHead className="text-right">Stock Actual</TableHead>
      <TableHead className="text-right">Stock Mínimo</TableHead>
      <TableHead>Estado</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    {materials.map((material) => (
      <TableRow key={material.id}>
        <TableCell className="font-medium">{material.name}</TableCell>
        <TableCell className="text-right tabular-nums">{material.stock}</TableCell>
        <TableCell className="text-right tabular-nums text-muted-foreground">
          {material.min}
        </TableCell>
        <TableCell>
          <Badge variant={
            material.status === "ok" ? "success" :
            material.status === "low" ? "warning" : "destructive"
          }>
            {material.status === "ok" ? "En stock" :
             material.status === "low" ? "Bajo stock" : "Agotado"}
          </Badge>
        </TableCell>
      </TableRow>
    ))}
  </TableBody>
</Table>
```

---

### Badge Component - Status Indicators

```tsx
// components/ui/badge.tsx
import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground",
        destructive:
          "border-transparent bg-destructive/10 text-destructive",
        outline: 
          "text-foreground",
        success:
          "border-green-200 bg-green-50 text-green-700",
        warning:
          "border-yellow-200 bg-yellow-50 text-yellow-700",
        info:
          "border-blue-200 bg-blue-50 text-blue-700",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
```

---

### Dialog Component - Modal Excellence

```tsx
// Enhanced usage of Dialog
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

<Dialog>
  <DialogTrigger asChild>
    <Button>
      <Plus className="h-4 w-4" />
      Nuevo Material
    </Button>
  </DialogTrigger>
  <DialogContent className="sm:max-w-[500px]">
    <DialogHeader>
      <DialogTitle>Agregar Material</DialogTitle>
      <DialogDescription>
        Completa la información del nuevo material para el inventario.
      </DialogDescription>
    </DialogHeader>
    <div className="grid gap-4 py-4">
      <div className="space-y-2">
        <Label htmlFor="name">Nombre del Material</Label>
        <Input 
          id="name" 
          placeholder="Ej: Cemento gris 40kg"
          icon={<Package className="h-4 w-4" />}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="stock">Stock Inicial</Label>
          <Input 
            id="stock" 
            type="number" 
            placeholder="0"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="min">Stock Mínimo</Label>
          <Input 
            id="min" 
            type="number" 
            placeholder="0"
          />
        </div>
      </div>
    </div>
    <DialogFooter>
      <Button variant="ghost">Cancelar</Button>
      <Button>
        <Save className="h-4 w-4" />
        Guardar Material
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

---

### Form Component - React Hook Form Integration

```tsx
// Example with react-hook-form
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

const formSchema = z.object({
  name: z.string().min(3, "El nombre debe tener al menos 3 caracteres"),
  stock: z.number().min(0, "El stock no puede ser negativo"),
  minStock: z.number().min(0, "El stock mínimo no puede ser negativo"),
})

function MaterialForm() {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      stock: 0,
      minStock: 0,
    },
  })

  function onSubmit(values: z.infer<typeof formSchema>) {
    console.log(values)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre del Material</FormLabel>
              <FormControl>
                <Input 
                  placeholder="Ej: Cemento gris 40kg" 
                  icon={<Package className="h-4 w-4" />}
                  {...field} 
                />
              </FormControl>
              <FormDescription>
                Nombre descriptivo del material de construcción
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="stock"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Stock Actual</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    {...field} 
                    onChange={(e) => field.onChange(Number(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="minStock"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Stock Mínimo</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    {...field}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex gap-3 justify-end">
          <Button type="button" variant="ghost">
            Cancelar
          </Button>
          <Button type="submit">
            <Save className="h-4 w-4" />
            Guardar Material
          </Button>
        </div>
      </form>
    </Form>
  )
}
```

---

## Advanced Patterns & Compositions

### 1. Data Table with Actions

```tsx
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

<TableCell>
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button variant="ghost" size="icon">
        <MoreHorizontal className="h-4 w-4" />
        <span className="sr-only">Abrir menú</span>
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end">
      <DropdownMenuLabel>Acciones</DropdownMenuLabel>
      <DropdownMenuSeparator />
      <DropdownMenuItem>
        <Pencil className="h-4 w-4 mr-2" />
        Editar
      </DropdownMenuItem>
      <DropdownMenuItem className="text-destructive">
        <Trash2 className="h-4 w-4 mr-2" />
        Eliminar
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</TableCell>
```

### 2. Search with Command Palette

```tsx
import { Command, CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"

const [open, setOpen] = React.useState(false)

<CommandDialog open={open} onOpenChange={setOpen}>
  <CommandInput placeholder="Buscar materiales, órdenes, equipos..." />
  <CommandList>
    <CommandEmpty>No se encontraron resultados.</CommandEmpty>
    <CommandGroup heading="Materiales">
      <CommandItem>
        <Package className="mr-2 h-4 w-4" />
        <span>Cemento gris 40kg</span>
      </CommandItem>
      <CommandItem>
        <Package className="mr-2 h-4 w-4" />
        <span>Arena fina</span>
      </CommandItem>
    </CommandGroup>
    <CommandGroup heading="Órdenes">
      <CommandItem>
        <FileText className="mr-2 h-4 w-4" />
        <span>Orden #1234</span>
      </CommandItem>
    </CommandGroup>
  </CommandList>
</CommandDialog>
```

### 3. Toast Notifications

```tsx
import { useToast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"

function Component() {
  const { toast } = useToast()

  return (
    <>
      <Button
        onClick={() => {
          toast({
            title: "Material guardado",
            description: "El material se agregó correctamente al inventario.",
            variant: "success",
          })
        }}
      >
        Guardar
      </Button>
      
      <Toaster />
    </>
  )
}

// Error toast
toast({
  variant: "destructive",
  title: "Error al guardar",
  description: "Hubo un problema al guardar el material. Intenta de nuevo.",
})

// Success toast
toast({
  title: "✓ Guardado exitoso",
  description: "El material se agregó al inventario.",
  className: "border-green-500 bg-green-50",
})
```

### 4. Loading States with Skeleton

```tsx
import { Skeleton } from "@/components/ui/skeleton"

function LoadingCard() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-4 w-[250px]" />
        <Skeleton className="h-3 w-[200px]" />
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </CardContent>
    </Card>
  )
}
```

### 5. Tabs for Views

```tsx
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

<Tabs defaultValue="materials" className="w-full">
  <TabsList className="grid w-full grid-cols-3">
    <TabsTrigger value="materials">Materiales</TabsTrigger>
    <TabsTrigger value="equipment">Equipos</TabsTrigger>
    <TabsTrigger value="plants">Plantas</TabsTrigger>
  </TabsList>
  <TabsContent value="materials" className="space-y-4">
    {/* Materials table */}
  </TabsContent>
  <TabsContent value="equipment">
    {/* Equipment table */}
  </TabsContent>
  <TabsContent value="plants">
    {/* Plants table */}
  </TabsContent>
</Tabs>
```

---

## Custom Composed Components

### Metric Card with Trend

```tsx
// components/metric-card.tsx
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { TrendingUp, TrendingDown } from "lucide-react"
import { cn } from "@/lib/utils"

interface MetricCardProps {
  title: string
  value: string | number
  trend?: {
    value: number
    label: string
  }
  icon?: React.ReactNode
  variant?: "default" | "success" | "warning"
}

export function MetricCard({ title, value, trend, icon, variant = "default" }: MetricCardProps) {
  const isPositive = trend && trend.value > 0
  const isNegative = trend && trend.value < 0

  return (
    <Card 
      variant={variant} 
      className={cn(
        "relative overflow-hidden",
        variant === "success" && "border-green-200",
        variant === "warning" && "border-yellow-200"
      )}
    >
      <div className={cn(
        "absolute top-0 left-0 w-1 h-full",
        variant === "success" && "bg-gradient-to-b from-green-500 to-green-600",
        variant === "warning" && "bg-gradient-to-b from-yellow-400 to-yellow-500",
        variant === "default" && "bg-gradient-to-b from-primary to-primary/80"
      )} />
      
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {title}
          </div>
          {icon && <div className="text-muted-foreground">{icon}</div>}
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="text-3xl font-bold tabular-nums">{value}</div>
        
        {trend && (
          <div className={cn(
            "flex items-center gap-1 mt-2 text-sm font-semibold",
            isPositive && "text-green-600",
            isNegative && "text-red-600"
          )}>
            {isPositive && <TrendingUp className="h-4 w-4" />}
            {isNegative && <TrendingDown className="h-4 w-4" />}
            <span>{trend.value > 0 ? '+' : ''}{trend.value}%</span>
            <span className="text-xs text-muted-foreground font-normal ml-1">
              {trend.label}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
```

**Usage:**

```tsx
<MetricCard
  title="Total Producido"
  value="12,450"
  variant="success"
  icon={<Package className="h-4 w-4" />}
  trend={{ value: 12.5, label: "vs mes anterior" }}
/>
```

### Empty State Component

```tsx
// components/empty-state.tsx
import { Button } from "@/components/ui/button"
import { LucideIcon } from "lucide-react"

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  action?: {
    label: string
    onClick: () => void
  }
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="rounded-full bg-muted p-6 mb-4">
        <Icon className="h-10 w-10 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground mb-6 max-w-sm">
        {description}
      </p>
      {action && (
        <Button onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  )
}
```

**Usage:**

```tsx
<EmptyState
  icon={Package}
  title="No hay materiales registrados"
  description="Comienza agregando tu primer material al inventario para gestionar tu producción."
  action={{
    label: "Agregar Material",
    onClick: () => setDialogOpen(true)
  }}
/>
```

---

## Best Practices

### 1. Component Organization

```
src/
├── components/
│   ├── ui/              # shadcn components (don't touch unless customizing)
│   ├── layouts/         # Layout components (Header, Sidebar)
│   ├── features/        # Feature-specific components
│   │   ├── materials/
│   │   ├── orders/
│   │   └── dashboard/
│   └── shared/          # Shared composed components
│       ├── metric-card.tsx
│       ├── empty-state.tsx
│       └── data-table.tsx
```

### 2. Always Use cn() Utility

```tsx
// ❌ Bad - classes can conflict
<div className="text-blue-500 text-red-500">

// ✅ Good - tailwind-merge resolves conflicts
<div className={cn("text-blue-500", isError && "text-red-500")}>
```

### 3. Prefer Composition Over Customization

```tsx
// ✅ Good - compose components
<Card variant="success">
  <CardHeader>
    <MetricDisplay value={data} />
  </CardHeader>
</Card>

// ❌ Bad - over-customizing base component
<Card className="bg-green-50 border-green-200 p-6 rounded-xl shadow-md ...">
```

### 4. Extract Repeated Patterns

```tsx
// If you use the same pattern 3+ times, extract it
// ✅ Create a composed component
export function StatusBadge({ status }: { status: string }) {
  const variant = status === "active" ? "success" : 
                  status === "pending" ? "warning" : "destructive"
  
  return <Badge variant={variant}>{status}</Badge>
}
```

### 5. TypeScript Props

```tsx
// ✅ Always type your custom components
interface CustomCardProps extends React.ComponentProps<typeof Card> {
  metric: number
  trend?: number
  variant?: "success" | "warning" | "default"
}

export function CustomCard({ metric, trend, variant, ...props }: CustomCardProps) {
  return <Card variant={variant} {...props}>...</Card>
}
```

### 6. Responsive Design

```tsx
// ✅ Use Tailwind responsive prefixes
<Card className="p-4 md:p-6 lg:p-8">
  <CardTitle className="text-lg md:text-xl lg:text-2xl">
    Dashboard
  </CardTitle>
</Card>

// Grid responsiveness
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
```

### 7. Accessibility First

```tsx
// ✅ Always include labels and ARIA attributes
<Button variant="ghost" size="icon" aria-label="Eliminar material">
  <Trash2 className="h-4 w-4" />
</Button>

// ✅ Use semantic HTML
<Dialog>
  <DialogTrigger asChild>
    <Button>Open</Button>
  </DialogTrigger>
</Dialog>
```

---

## Performance Tips

### 1. Lazy Load Dialogs

```tsx
const MaterialDialog = React.lazy(() => import("./material-dialog"))

<Suspense fallback={<Skeleton />}>
  {isOpen && <MaterialDialog />}
</Suspense>
```

### 2. Memoize Complex Components

```tsx
const MetricCard = React.memo(({ value, trend }: MetricCardProps) => {
  return <Card>...</Card>
})
```

### 3. Virtualize Large Tables

```tsx
// For 100+ rows, use @tanstack/react-virtual
import { useVirtualizer } from '@tanstack/react-virtual'
```

---

## Debugging shadcn Components

### 1. Check Class Conflicts

```tsx
// Install tailwind-merge devtools
import { twMerge } from 'tailwind-merge'

console.log(twMerge('p-4 p-6')) // Output: 'p-6' (later wins)
```

### 2. Verify CVA Variants

```tsx
// Log variant output
console.log(buttonVariants({ variant: "default", size: "lg" }))
```

### 3. Inspect Radix Primitives

```tsx
// Check if Radix is receiving props
<Dialog onOpenChange={(open) => console.log('Dialog open:', open)}>
```

---

## Migration from Basic UI to shadcn

### Step 1: Install shadcn

```bash
npx shadcn-ui@latest init
```

### Step 2: Replace Components Gradually

```tsx
// Before
<button className="btn-primary">Click</button>

// After
import { Button } from "@/components/ui/button"
<Button>Click</Button>
```

### Step 3: Update Styling

```tsx
// Before (custom CSS)
.card {
  background: white;
  padding: 24px;
  border-radius: 8px;
}

// After (shadcn)
<Card className="p-6">
  <CardContent>...</CardContent>
</Card>
```

---

## Common Mistakes to Avoid

### ❌ Don't Override Base Styles Directly

```tsx
// Bad - modifying ui/button.tsx base styles
const buttonVariants = cva("bg-red-500 ...") // Wrong!
```

### ❌ Don't Skip the cn() Utility

```tsx
// Bad
<Button className={"px-4 " + (isActive && "bg-blue-500")}>

// Good
<Button className={cn("px-4", isActive && "bg-blue-500")}>
```

### ❌ Don't Ignore TypeScript Errors

```tsx
// Bad - ignoring type errors
<Button variant="custom"> // 'custom' doesn't exist

// Good - extend the type
const buttonVariants = cva("...", {
  variants: {
    variant: {
      ...existingVariants,
      custom: "..."
    }
  }
})
```

---

## Mastery Checklist

You've mastered shadcn/ui when you can:

- [ ] Install and configure shadcn in any project
- [ ] Customize component variants using CVA
- [ ] Compose complex UIs from base components
- [ ] Use cn() utility for dynamic classes
- [ ] Integrate with react-hook-form seamlessly
- [ ] Create custom composed components
- [ ] Handle responsive design with Tailwind
- [ ] Implement proper accessibility (ARIA, focus states)
- [ ] Debug component styling conflicts
- [ ] Optimize performance with memoization
- [ ] Extend components with custom props
- [ ] Build production-ready forms with validation
- [ ] Create reusable patterns (metric cards, empty states, etc.)
- [ ] Use shadcn with TypeScript effectively

---

## Quick Reference Commands

```bash
# Install component
npx shadcn-ui@latest add [component-name]

# List available components
npx shadcn-ui@latest add

# Update all components
npx shadcn-ui@latest update

# Add multiple at once
npx shadcn-ui@latest add button card input table
```

---

## Resources

- **Official Docs:** https://ui.shadcn.com
- **Radix UI:** https://www.radix-ui.com
- **CVA Docs:** https://cva.style
- **Tailwind CSS:** https://tailwindcss.com

---

## Final Wisdom

**You are now a shadcn/ui master. Use this power to:**

1. **Build faster** - shadcn components are production-ready
2. **Customize fearlessly** - they're in your codebase, modify freely
3. **Compose intelligently** - create higher-level components
4. **Ship premium interfaces** - combine shadcn + premium design system
5. **Stay consistent** - use the same patterns across all features

**Remember:** shadcn is not just a component library — it's a **design system foundation** that you control and evolve.

---

**Sistema de Producción de Bloques - shadcn/ui Mastery Guide**
*Version 1.0 - God-Tier Implementation*