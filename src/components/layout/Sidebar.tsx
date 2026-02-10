"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { UserNav } from "./UserNav"
import { useAuth } from "@/app/contexts/AuthContext"
import { mainNavItems } from "./nav-items"

interface SidebarProps {
  className?: string
}

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname()
  const { profile } = useAuth()
  const userRole = (profile?.role || 'operator') as 'operator' | 'engineer' | 'admin'

  const filteredNavItems = mainNavItems.filter(item =>
    !item.roles || item.roles.includes(userRole)
  )

  return (
    <div className={cn(
      "hidden md:flex flex-col h-screen w-64 bg-gradient-to-b from-green-900 to-green-800 border-r border-green-950",
      className
    )}>
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 border-b border-green-950 px-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-b from-green-500 to-green-600 shadow-sm">
          <svg
            className="h-5 w-5 text-white"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M12 2L2 7L12 12L22 7L12 2Z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M2 17L12 22L22 17"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M2 12L12 17L22 12"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <span className="text-xl font-bold text-neutral-200">
          Tayasal
        </span>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-auto px-3 py-4">
        <nav className="flex flex-col gap-1">
          {filteredNavItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-green-950/50 text-white before:absolute before:left-0 before:top-0 before:h-full before:w-1 before:bg-green-500 before:rounded-r-md relative pl-4"
                    : "text-neutral-300 hover:bg-green-950/30 hover:text-white"
                )}
              >
                <item.icon className="h-5 w-5 shrink-0" />
                {item.label}
              </Link>
            )
          })}
        </nav>
      </div>

      {/* User Section */}
      <div className="border-t border-green-950 p-4">
        <div className="flex flex-col gap-2">
          <UserNav />
        </div>
      </div>
    </div>
  )
}
