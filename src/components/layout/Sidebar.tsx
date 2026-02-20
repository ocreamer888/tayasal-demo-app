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
      "hidden md:flex flex-col h-screen w-64 backdrop-blur-md border-x border-r-white/20 rounded-2xl",
      className
    )}>
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 border-b border-white/20 rounded-b-2xl px-6">
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
        <span className="text-4xl font-bold text-neutral-200">
          Tayasal
        </span>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-auto px-4 py-4">
        <nav className="flex flex-col gap-1 justify-around rounded-2xl h-full">
          {filteredNavItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center justify-start pl-4 gap-4 rounded-full bg-white/10 py-2 text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-white/80 text-black relative pl-8"
                    : "text-neutral-300 hover:bg-green-100/40 font-bold hover:text-white"
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
      <div className="border-t border-white/20 rounded-t-2xl p-4">
        <div className="flex flex-row gap-4">
          <UserNav />
        </div>
      </div>
    </div>
  )
}
