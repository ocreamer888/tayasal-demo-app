'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { ReportGenerator } from '@/components/reports/ReportGenerator'
import { useAuth } from '@/app/contexts/AuthContext'
import { Loader2 } from 'lucide-react'
import { Sidebar } from '@/components/layout/Sidebar'
import { Header } from '@/components/layout/Header'

/**
 * Reports Page
 *
 * Protected page accessible only by engineers and admins.
 * Provides report generation interface.
 */
export default function ReportsPage() {
 const router = useRouter()
 const { profile, loading: authLoading } = useAuth()

 // Auth guard: redirect if not engineer/admin
 useEffect(() => {
   if (!authLoading && profile) {
     const allowedRoles = ['engineer', 'admin']
     if (!allowedRoles.includes(profile.role)) {
       router.replace('/dashboard')
     }
   } else if (!authLoading && !profile) {
     router.replace('/login')
   }
 }, [authLoading, profile, router])

 // Show loading while checking auth
 if (authLoading) {
   return (
     <div className="flex items-center justify-center min-h-[50vh]">
       <Loader2 className="h-8 w-8 animate-spin text-[#15803d]" />
     </div>
   )
 }

 // If not authorized, don't render content (redirect will happen)
 if (!profile || !['engineer', 'admin'].includes(profile.role)) {
   return null
 }

 return (
  <div className="min-h-screen flex">
   
     {/* Desktop Sidebar - hidden on mobile */}
     <Sidebar className="hidden md:flex" /> 

    {/* Content Area */}
    <div className="flex-1 flex flex-col min-h-screen">
        {/* Mobile Header */}
        <Header className="md:hidden" />

     {/* Header */}
     <main className="flex-1 mx-auto w-full max-w-9xl px-4 py-8 max-h-screen overflow-y-auto gap-8">
     <h1 className="text-3xl font-bold text-gray-200">Reportes de Producción</h1>
       <p className="text-gray-400 pt-4 pb-12">
         Genere informes detallados de producción, costos e inventario para períodos
         específicos. Exporte en formato Excel o PDF.
       </p>
     

     {/* Report Generator */}
     <ReportGenerator />
  </main >
   </div>
   </div>
   
 )
}
