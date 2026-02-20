'use client'

import { useState, useCallback } from 'react'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { ReportForm } from './ReportForm'
import { ReportPreview } from './ReportPreview'
import type { ReportConfig, ReportData } from '@/types/reports'
import { aggregateReportData } from '@/lib/utils/report-data-aggregator'
import { exportToExcel } from '@/lib/utils/excel-exporter'
import { exportToPDF } from '@/lib/utils/pdf-exporter'
import { useProductionOrders } from '@/lib/hooks/useProductionOrders'
import { useInventoryMaterials } from '@/lib/hooks/useInventoryMaterials'
import { useAuth } from '@/app/contexts/AuthContext'

/**
 * ReportGenerator Component
 *
 * Main container for generating production reports.
 * Orchestrates data aggregation and export in Excel/PDF formats.
 */
export function ReportGenerator() {
 // Auth context to get user role
 const { profile } = useAuth()
 const userRole = profile?.role || null

 // Data fetching hooks
 const { orders = [], loading: ordersLoading } = useProductionOrders({ userRole })
 const { materials: inventoryMaterials = [], loading: inventoryLoading } =
   useInventoryMaterials({ userRole })

 // UI state
 const [showPreview, setShowPreview] = useState(false)
 const [reportData, setReportData] = useState<ReportData | null>(null)
 const [previewConfig, setPreviewConfig] = useState<ReportConfig | null>(null)
 const [isGenerating, setIsGenerating] = useState(false)

 /**
  * Handle preview request: aggregate data and show modal.
  */
 const handlePreview = useCallback(async (config: ReportConfig) => {
   if (ordersLoading) {
     toast.error('Cargando órdenes de producción...')
     return
   }

   try {
     const data = aggregateReportData(config, orders, inventoryMaterials)
     setReportData(data)
     setPreviewConfig(config)
     setShowPreview(true)
   } catch (err) {
     const message = err instanceof Error ? err.message : 'Error al generar reporte'
     toast.error(message)
   }
 }, [orders, inventoryMaterials, ordersLoading])

 /**
  * Handle export request: aggregate data and call appropriate exporter(s).
  */
 const handleExport = useCallback(
   async (config: ReportConfig) => {
     if (ordersLoading) {
       toast.error('Cargando órdenes de producción...')
       return
     }

     setIsGenerating(true)

     try {
       // 1. Aggregate data
       const data = aggregateReportData(config, orders, inventoryMaterials)

       // 2. Export based on format
       const { format } = config

       if (format === 'excel' || format === 'both') {
         exportToExcel(data)
         toast.success('Excel generado correctamente')
       }

       if (format === 'pdf' || format === 'both') {
         exportToPDF(data)
         if (format === 'both') {
           toast.success('Ambos formatos generados')
         } else {
           toast.success('PDF generado correctamente')
         }
       }
     } catch (err) {
       const message = err instanceof Error ? err.message : 'Error al exportar reporte'
       toast.error(message)
     } finally {
       setIsGenerating(false)
     }
   },
   [orders, inventoryMaterials, ordersLoading]
 )

 // If data is still loading, show a loading message
 if (ordersLoading || inventoryLoading) {
   return (
     <Card>
       <CardContent className="flex items-center justify-center py-12">
         <p className="text-gray-500">Cargando datos de producción...</p>
       </CardContent>
     </Card>
   )
 }

 return (
   <div className="space-y-6 w-full">
     <Card className="gap-4 py-8 w-full">
       <CardHeader className="w-full pb-8">
         <CardTitle className="text-2xl text-gray-300">
           Generar Reporte
         </CardTitle>
         <CardDescription>
           Crea informes de producción en Excel y/o PDF para el período seleccionado.
           Incluye resumen, órdenes, costos e inventario según las opciones.
         </CardDescription>
       </CardHeader>
       <CardContent className="w-full gap-8">
         <ReportForm
           onSubmit={handleExport}
           onPreview={handlePreview}
           isLoading={isGenerating}
           
         />
       </CardContent >
     </Card>

     {/* Preview Modal */}
     <ReportPreview
       reportData={reportData}
       isOpen={showPreview}
       isLoading={isGenerating}
       onClose={() => setShowPreview(false)}
       onExport={() => {
         if (previewConfig) {
           handleExport(previewConfig)
         }
       }}
     />
   </div>
 )
}
