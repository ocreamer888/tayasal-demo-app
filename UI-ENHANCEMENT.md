 Analysis Summary                                                                                                                                                        
                                                                                                                                                                          
  I've analyzed your UI.md design system and current codebase:                                                                                                            
                                                                                                                                                                          
  Current State:
  - ✅ shadcn CLI installed (v3.8.4)
  - ✅ Custom Button, Card, Input components exist
  - ✅ Recharts installed (needs replacement with shadcn/charts)                                                                                                          
  - ✅ Tailwind CSS 4, Next.js 16, React 19                                                                                                                               
  - ✅ lucide-react icons                                                                                                                                                 
                                                                                                                                                                          
  UI.md Requirements:                                                                                                                                                     
  - Green primary palette (#22C55E) + Yellow warnings (#EAB308)                                                                                                           
  - Neutral scale for hierarchy
  - Inter font with corporate typography scale
  - Premium shadows, 8px grid, refined spacing
  - Modern corporate aesthetic (Notion/Linear/Stripe)

  ---
  Proposed Implementation Plan

  Phase 1: Install & Initialize shadcn/ui

  1. Initialize shadcn/ui with modern configuration:
    - Run npx shadcn@latest init to create components.json
    - Configure base style to use CSS variables for theming
    - Set default component style to "new York" (modern)
  2. Install essential shadcn/ui components (all styled to UI.md spec):
    - Button (replace custom Button)
    - Card (replace custom Card)
    - Input (replace custom Input)
    - Select, Checkbox, Radio Group (for forms)
    - Table, Badge, Avatar (for data display)
    - Dialog, AlertDialog, Toast (for interactions)
    - Tabs, Accordion (for navigation)
    - DropdownMenu, Menubar
    - Separator, Skeleton (for structure)
  3. Create custom CSS theme in globals.css:
    - Map UI.md colors to shadcn CSS variables
    - Define:
        - --primary: green-500 / green-600
      - --secondary: neutral-100
      - --accent: yellow-400
      - --destructive: red-500
      - --border: neutral-200
      - --input: neutral-200
      - --ring: green-500
    - Configure border-radius (8px for premium feel)
    - Set font family to Inter

  Phase 2: Customize Gradients & Premium Styling

  4. Create premium button variants:
    - Add gradient style for primary buttons (linear-gradient 180deg green-500 to green-600)
    - Implement hover lift effect (translateY -1px)
    - Add subtle inner shadow for depth
  5. Create premium card variants:
    - Standard card (neutral-0 with shadow-sm)
    - Metric card (gradient green-50 background, left green accent bar)
    - Elevated card (shadow-xl for modals)
  6. Add custom animations:
    - Smooth transitions (150-200ms cubic-bezier)
    - Hover scale effects on interactive elements
    - Ripple effect for buttons (optional)
    - Slide-in animation for toasts

  Phase 3: Replace Recharts with shadcn/charts

  7. Remove recharts dependency and install shadcn/charts:
    - npm uninstall recharts
    - npx shadcn@latest add chart
    - shadcn/charts uses recharts under the hood but provides styled components
  8. Configure chart theming to match UI.md:
    - Set primary chart color to green-500
    - Set accent/warning to yellow-500
    - Use neutral-600 for labels, neutral-900 for axes
    - Apply consistent radius (8-12px)
    - Add subtle grid lines (neutral-100)
    - Use Inter font for chart text
  9. Create chart wrapper components:
    - LineChart with gradient area fill
    - BarChart with rounded corners
    - PieChart with green/yellow/neutral palette
    - All charts should use tabular-nums for data

  Phase 4: Migration & Integration

  10. Migrate existing components:
    - Replace Button usages with shadcn Button (preserving loading state, variants)
    - Replace Card usages with shadcn Card
    - Replace Input usages with shadcn Input
    - Update imports in all pages and components
  11. Create premium UI components (if needed):
    - MetricCard (as per UI.md card-metric spec)
    - DataTable (with sticky headers, sorting)
    - StatusBadge (green/yellow/red variants)
    - PageHeader (with proper H1/H2 hierarchy)
    - FormLayout (consistent spacing)
  12. Update navigation components:
    - Header with glassmorphism effect (backdrop-blur)
    - Sidebar navigation with active states
    - All navigation items use green accent for active

  Phase 5: Responsive & Accessible Polish

  13. Ensure responsive design:
    - All components follow UI.md breakpoints (sm: 640px, md: 768px, lg: 1024px, xl: 1280px)
    - Mobile-first approach
    - Proper grid layouts (col-span adjustments)
  14. Accessibility audit:
    - All components have proper ARIA labels
    - Focus visible states with green ring
    - Touch targets minimum 44×44px
    - Keyboard navigation works
    - Color contrast meets WCAG AA
  15. Performance optimization:
    - Lazy load heavy components (charts)
    - Use Next.js Image for any icons/illustrations
    - Tree-shake unused shadcn components
    - Add loading skeletons for all data-heavy components