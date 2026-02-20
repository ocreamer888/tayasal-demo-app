'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
 RadioGroup,
 RadioGroupItem,
} from '@/components/ui/radio-group'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { CalendarIcon } from 'lucide-react'

import type { CycleType, ReportConfig, ReportSections, ExportFormat } from '@/types/reports'
import { getDateRangeForCycle } from '@/lib/utils/report-templates'

// Helper to format date for input value (YYYY-MM-DD)
function toInputDate(date: Date): string {
 return date.toISOString().split('T')[0]
}

// Helper to parse input date string to Date
function parseInputDate(value: string): Date | null {
 if (!value) return null
 return new Date(value + 'T00:00:00') // local midnight
}

interface ReportFormProps {
 onSubmit: (config: ReportConfig) => void
 onPreview?: (config: ReportConfig) => void
 isLoading?: boolean
}

/**
 * ReportForm Component
 *
 * Allows users to configure report generation:
 * - Cycle type (Daily, Weekly, Monthly, Custom)
 * - Date range (dynamic based on cycle)
 * - Sections to include
 * - Export format (Excel, PDF, Both)
 */
export function ReportForm({ onSubmit, onPreview, isLoading = false }: ReportFormProps) {
 // Form state
 const [cycleType, setCycleType] = useState<CycleType>('daily')
 const [startDate, setStartDate] = useState<Date>(new Date())
 const [endDate, setEndDate] = useState<Date>(new Date())
 const [sections, setSections] = useState<ReportSections>({
   summary: true,
   orders: true,
   costs: true,
   inventory: true,
 })
 const [format, setFormat] = useState<ExportFormat>('excel')
 const [errors, setErrors] = useState<string[]>([])

 // Helper to update date range based on cycle (presets)
 useEffect(() => {
   if (cycleType !== 'custom') {
     const range = getDateRangeForCycle(cycleType)
     setStartDate(range.start)
     setEndDate(range.end)
   }
   // eslint-disable-next-line react-hooks/exhaustive-deps
 }, [cycleType])

 // Handlers
 const handleCycleChange = (value: string) => {
   const newCycle = value as CycleType
   setCycleType(newCycle)
 }

 const handleDateChange = (type: 'start' | 'end', value: string) => {
   const date = parseInputDate(value)
   if (date) {
     if (type === 'start') {
       setStartDate(date)
     } else {
       setEndDate(date)
     }
   }
 }

 const handleSectionChange = (key: keyof ReportSections, checked: boolean) => {
   setSections((prev) => ({ ...prev, [key]: checked }))
 }

 const validate = (): boolean => {
   const newErrors: string[] = []

   // At least one section must be selected
   if (!sections.summary && !sections.orders && !sections.costs && !sections.inventory) {
     newErrors.push('Debe seleccionar al menos una sección para incluir en el reporte.')
   }

   // Valid date range
   if (startDate > endDate) {
     newErrors.push('La fecha de inicio no puede ser posterior a la fecha de fin.')
   }

   setErrors(newErrors)
   return newErrors.length === 0
 }

 const buildConfig = (): ReportConfig => ({
   dateRange: { start: startDate, end: endDate },
   cycleType,
   sections,
   format,
 })

 const handlePreview = () => {
   if (validate() && onPreview) {
     onPreview(buildConfig())
   }
 }

 const handleSubmit = (e: React.FormEvent) => {
   e.preventDefault()
   if (validate()) {
     onSubmit(buildConfig())
   }
 }

 return (
   <Card className="w-full mx-auto">
     <CardHeader className="w-full">
       <CardTitle>Configuración del Reporte</CardTitle>
     </CardHeader>
     <CardContent>
       <form onSubmit={handleSubmit} className="space-y-8 w-full">
         {/* Cycle Type */}
         <div>
           <Label className="block text-sm font-medium mb-2">Ciclo</Label>
           <RadioGroup value={cycleType} onValueChange={handleCycleChange}>
             <div className="flex flex-wrap gap-4">
               <div className="flex items-center space-x-2">
                 <RadioGroupItem value="daily" id="daily" />
                 <Label htmlFor="daily">Diario</Label>
               </div>
               <div className="flex items-center space-x-2">
                 <RadioGroupItem value="weekly" id="weekly" />
                 <Label htmlFor="weekly">Semanal</Label>
               </div>
               <div className="flex items-center space-x-2">
                 <RadioGroupItem value="monthly" id="monthly" />
                 <Label htmlFor="monthly">Mensual</Label>
               </div>
               <div className="flex items-center space-x-2">
                 <RadioGroupItem value="custom" id="custom" />
                 <Label htmlFor="custom">Personalizado</Label>
               </div>
             </div>
           </RadioGroup>
         </div>

         {/* Date Inputs */}
         <div>
           <Label className="block text-sm font-medium mb-2">
               {cycleType === 'custom' ? 'Rango de Fechas' : 'Fecha'}
             </Label>
           <div className="flex flex-col sm:flex-row gap-4">
             <div className="flex-1">
               <Label htmlFor="startDate" className="text-xs text-gray-500">
                 {cycleType === 'custom' ? 'Desde' : 'Fecha'}
               </Label>
               <div className="relative">
                 <input
                   id="startDate"
                   type="date"
                   value={toInputDate(startDate)}
                   onChange={(e) => handleDateChange('start', e.target.value)}
                   className="w-full border rounded px-3 py-2"
                 />
                 <CalendarIcon className="absolute right-3 top-2.5 h-4 w-4 text-gray-400" />
               </div>
             </div>
             {cycleType === 'custom' && (
               <div className="flex-1">
                 <Label htmlFor="endDate" className="text-xs text-gray-500">
                   Hasta
                 </Label>
                 <div className="relative">
                   <input
                     id="endDate"
                     type="date"
                     value={toInputDate(endDate)}
                     onChange={(e) => handleDateChange('end', e.target.value)}
                     className="w-full border rounded px-3 py-2"
                   />
                   <CalendarIcon className="absolute right-3 top-2.5 h-4 w-4 text-gray-400" />
                 </div>
               </div>
             )}
           </div>
           {/* Show computed range for non-custom */}
           {cycleType !== 'custom' && (
             <p className="text-sm text-gray-500 mt-2">
               Rango: {formatDateRange(startDate, endDate)}
             </p>
           )}
         </div>

         {/* Sections */}
         <div>
           <Label className="block text-sm font-medium mb-2">Secciones a incluir</Label>
           <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
             <div className="flex items-center space-x-2">
               <Checkbox
                 id="summary"
                 checked={sections.summary}
                 onCheckedChange={(checked: boolean) => handleSectionChange('summary', checked)}
               />
               <Label htmlFor="summary">Resumen Ejecutivo</Label>
             </div>
             <div className="flex items-center space-x-2">
               <Checkbox
                 id="orders"
                 checked={sections.orders}
                 onCheckedChange={(checked: boolean) => handleSectionChange('orders', checked)}
               />
               <Label htmlFor="orders">Órdenes de Producción</Label>
             </div>
             <div className="flex items-center space-x-2">
               <Checkbox
                 id="costs"
                 checked={sections.costs}
                 onCheckedChange={(checked: boolean) => handleSectionChange('costs', checked)}
               />
               <Label htmlFor="costs">Análisis de Costos</Label>
             </div>
             <div className="flex items-center space-x-2">
               <Checkbox
                 id="inventory"
                 checked={sections.inventory}
                 onCheckedChange={(checked: boolean) => handleSectionChange('inventory', checked)}
               />
               <Label htmlFor="inventory">Impacto en Inventario</Label>
             </div>
           </div>
         </div>

         {/* Format */}
         <div>
           <Label className="block text-sm font-medium mb-2">Formato de Exportación</Label>
           <RadioGroup value={format} onValueChange={(v) => setFormat(v as ExportFormat)}>
             <div className="flex flex-wrap gap-4">
               <div className="flex items-center space-x-2">
                 <RadioGroupItem value="excel" id="excel" />
                 <Label htmlFor="excel">Excel</Label>
               </div>
               <div className="flex items-center space-x-2">
                 <RadioGroupItem value="pdf" id="pdf" />
                 <Label htmlFor="pdf">PDF</Label>
               </div>
               <div className="flex items-center space-x-2">
                 <RadioGroupItem value="both" id="both" />
                 <Label htmlFor="both">Ambos</Label>
               </div>
             </div>
           </RadioGroup>
         </div>

         {/* Errors */}
         {errors.length > 0 && (
           <div className="text-red-600 text-sm">
             {errors.map((err, idx) => (
               <p key={idx}>{err}</p>
             ))}
           </div>
         )}

         {/* Actions */}
         <div className="flex flex-col sm:flex-row gap-3 pt-4">
           <Button
             type="button"
             variant="outline"
             onClick={handlePreview}
             disabled={isLoading || !onPreview}
             className="flex-1"
           >
             Vista Previa
           </Button>
           <Button
             type="submit"
             disabled={isLoading}
             className="flex-1 bg-[#15803d] hover:bg-[#14532d]"
           >
             {isLoading ? 'Generando...' : 'Exportar'}
           </Button>
         </div>
       </form>
     </CardContent>
   </Card>
 )
}

// Helper to format date range for display
function formatDateRange(start: Date, end: Date): string {
 const startStr = start.toLocaleDateString('es-CL')
 const endStr = end.toLocaleDateString('es-CL')
 return `${startStr} - ${endStr}`
}
