import type { LucideIcon } from "lucide-react"
import { BarChart3, ClipboardList, Package, ShoppingCart, FileText } from "lucide-react"

export interface NavItem {
  label: string
  href: string
  icon: LucideIcon
  roles?: ('operator' | 'engineer' | 'admin')[]
}

export const mainNavItems: NavItem[] = [
  { label: "Dashboard", href: "/", icon: BarChart3 },
  { label: "Producción", href: "/production", icon: ClipboardList },
  { label: "Inventario", href: "/inventory", icon: Package },
  { label: "Pedidos", href: "/orders", icon: ShoppingCart },
  {
    label: "Reportes",
    href: "/reports",
    icon: FileText,
    roles: ['engineer', 'admin']
  },
]
