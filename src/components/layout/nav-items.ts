import type { LucideIcon } from "lucide-react"
import { BarChart3, ClipboardList, Package, FileText } from "lucide-react"

export interface NavItem {
  label: string
  href: string
  icon: LucideIcon
  roles?: ('operator' | 'engineer' | 'admin')[]
}

export const mainNavItems: NavItem[] = [
  { label: "Dashboard", 
    href: "/dashboard", 
    icon: BarChart3,
    roles: ['engineer', 'admin']
 },
  { label: "Producción", href: "/orders", icon: ClipboardList },
  { label: "Inventario", href: "/inventory", icon: Package },
  {
    label: "Reportes",
    href: "/reports",
    icon: FileText,
    roles: ['engineer', 'admin']
  },
]
