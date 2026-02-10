"use client"

import * as React from "react"
import Link from "next/link"
import { useAuth } from "@/app/contexts/AuthContext"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { User, LogOut, Settings } from "lucide-react"

export function UserNav() {
  const { user, profile, signOut } = useAuth()

  const getInitials = (name?: string | null, email?: string | null) => {
    const fullName = name || user?.user_metadata?.full_name || ""
    if (fullName) {
      return fullName
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    }
    if (email) {
      return email.charAt(0).toUpperCase()
    }
    return "U"
  }

  const displayName = profile?.company_name || user?.user_metadata?.full_name || user?.email || "Usuario"
  const userRoleLabel = profile?.role === "engineer" || profile?.role === "admin"
    ? "Ingeniero / Admin"
    : "Operario"

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-1/2 w-full flex items-center justify-between rounded-full bg-white/5 hover:bg-white/10 gap-4">
          <Avatar className="h-10 w-10 ring-2 ring-green-500 ring-offset-2">
            <AvatarImage src={user?.user_metadata?.avatar_url} alt={displayName} />
            <AvatarFallback className="bg-gradient-to-b from-green-500 to-green-600 text-white font-bold">
              {getInitials(undefined, user?.email)}
            </AvatarFallback>
          </Avatar>
          <span className="flex flex-col items-start w-full">
          <p className="text-sm font-medium leading-none text-neutral-200">
              {displayName}
            </p>
            <p className="text-xs leading-none text-neutral-300">
              {userRoleLabel}
            </p>
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none text-neutral-900">
              {displayName}
            </p>
            <p className="text-xs leading-none text-neutral-500">
              {userRoleLabel}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/profile" className="flex items-center cursor-pointer">
            <User className="mr-2 h-4 w-4" />
            <span>Perfil</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/settings" className="flex items-center cursor-pointer">
            <Settings className="mr-2 h-4 w-4" />
            <span>Configuración</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="cursor-pointer text-red-600 focus:text-red-600"
          onClick={async () => {
            await signOut()
          }}
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>Cerrar Sesión</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
