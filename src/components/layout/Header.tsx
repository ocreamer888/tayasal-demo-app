"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { UserNav } from "./UserNav"
import { Menu } from "lucide-react"
import { mainNavItems } from "./nav-items"
import { useAuth } from "@/app/contexts/AuthContext"

interface HeaderProps {
  className?: string
}

export function Header({ className }: HeaderProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const { profile } = useAuth()
  const userRole = (profile?.role || 'operator') as 'operator' | 'engineer' | 'admin'
  const pathname = usePathname()

  const filteredNavItems = mainNavItems.filter(item =>
    !item.roles || item.roles.includes(userRole)
  )

  return (
    <header className={cn(
      "sticky top-0 z-100 flex h-16 items-center justify-between px-6 bg-green-900/80 backdrop-blur-sm",
      className
    )}>
      {/* Logo */}
      <Link href="/" className="flex items-center gap-3">
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
      </Link>

      {/* Mobile Menu Button */}
      <div className="flex items-center gap-4">
        <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
          <SheetTrigger asChild>
            <Button variant="secondary" size="icon">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Abrir menú</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[352px] bg-gradient-to-t from-green-900 to-green-800">
            <div className="flex flex-col gap-6 py-6">
              <div className="flex items-center gap-3 px-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-b from-green-500 to-green-600 shadow-sm">
                  <svg
                    className="h-6 w-6 text-white"
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
                <span className="text-lg font-bold text-neutral-900">
                  Tayasal
                </span>
              </div>
              <nav className="flex flex-col gap-2">
                {filteredNavItems.map((item) => {
                  const isActive = pathname === item.href
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200",
                        isActive
                          ? "bg-green-950/50 text-white"
                          : "text-neutral-300 hover:bg-green-950/30 hover:text-white"
                      )}
                    >
                      <item.icon className="h-5 w-5" />
                      {item.label}
                    </Link>
                  )
                })}
                <div className="pt-2 border-t border-green-950 mt-2">
                  <UserNav />
                </div>
              </nav>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  )
}
