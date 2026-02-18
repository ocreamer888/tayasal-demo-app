'use client'

import {
 Dialog,
 DialogContent,
 DialogHeader,
 DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
 Table,
 TableBody,
 TableCell,
 TableHead,
 TableHeader,
 TableRow,
} from '@/components/ui/table'
import type { ReportData } from '@/types/reports'
import { formatCurrencyCLP, formatDateES } from '@/lib/utils/report-data-aggregator'
import { parseISO } from 'date-fns'

interface ReportPreviewProps {
 reportData: ReportData | null
 isOpen: boolean
 isLoading: boolean
 onClose: () => void
 onExport: () => void
}

/**
 * ReportPreview Modal
 *
 * Shows a summary of the generated report before export.
 * Includes summary cards and a preview of the first 50 orders.
 */
export function ReportPreview({
 reportData,
 isOpen,
 isLoading,
 onClose,
 onExport,
}: ReportPreviewProps) {
 if (!reportData) return null

 const { summary } = reportData

 return (
   <Dialog  open={isOpen} onOpenChange={onClose}>
     <DialogContent className="max-w-[90vw] max-h-[90vh] overflow-y-auto">
       <DialogHeader>
         <DialogTitle>Vista Previa del Reporte</DialogTitle>
       </DialogHeader>

       <div className="space-y-6">
         {/* Summary Cards */}
         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
           <SummaryCard
             label="Órdenes"
             value={summary.totalOrders.toString()}
           />
           <SummaryCard
             label="Bloques Producidos"
             value={summary.totalBlocks.toLocaleString('es-CL')}
           />
           <SummaryCard
             label="Costo Total"
             value={formatCurrencyCLP(summary.totalCost)}
           />
           <SummaryCard
             label="Costo/Bloque"
             value={formatCurrencyCLP(summary.avgCostPerBlock)}
           />
         </div>

         {/* Orders Preview Table */}
         <Card>
           <CardContent className="p-0">
             <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
               <Table>
                 <TableHeader className="sticky top-0 bg-white">
                   <TableRow>
                     <TableHead>ID</TableHead>
                     <TableHead>Fecha</TableHead>
                     <TableHead>Tipo</TableHead>
                     <TableHead>Cantidad</TableHead>
                     <TableHead>Estado</TableHead>
                     <TableHead>Materiales</TableHead>
                     <TableHead>Mano Obra</TableHead>
                     <TableHead>Equipo</TableHead>
                     <TableHead>Total</TableHead>
                     <TableHead>Operario</TableHead>
                   </TableRow>
                 </TableHeader>
                 <TableBody>
                   {reportData.orders.slice(0, 50).map((order) => (
                     <TableRow key={order.id}>
                       <TableCell className="font-mono text-xs">
                         {order.id.slice(0, 8)}...
                       </TableCell>
                       <TableCell>
                         {formatDateES(parseISO(order.production_date))}
                       </TableCell>
                       <TableCell>{order.block_type}</TableCell>
                       <TableCell>{order.quantity_produced}</TableCell>
                       <TableCell>
                         <span className="capitalize">{order.status}</span>
                       </TableCell>
                       <TableCell>
                         {formatCurrencyCLP(order.material_cost)}
                       </TableCell>
                       <TableCell>
                         {formatCurrencyCLP(order.labor_cost)}
                       </TableCell>
                       <TableCell>
                         {formatCurrencyCLP(order.equipment_cost)}
                       </TableCell>
                       <TableCell className="font-bold">
                         {formatCurrencyCLP(order.total_cost)}
                       </TableCell>
                       <TableCell>{order.created_by_name}</TableCell>
                     </TableRow>
                   ))}
                 </TableBody>
               </Table>
             </div>
           </CardContent>
         </Card>

         {reportData.orders.length > 50 && (
           <p className="text-sm text-gray-500 text-center">
             Mostrando las primeras 50 órdenes de un total de{' '}
             {reportData.orders.length}
           </p>
         )}

         {/* Actions */}
         <div className="flex justify-end gap-3 pt-4">
           <Button variant="outline" onClick={onClose}>
             Cerrar
           </Button>
           <Button
             onClick={onExport}
             disabled={isLoading}
             className="bg-[#15803d] hover:bg-[#14532d]"
           >
             {isLoading ? 'Generando...' : 'Exportar Reporte'}
           </Button>
         </div>
       </div>
     </DialogContent>
   </Dialog>
 )
}

// ============================================================================
// Summary Card Subcomponent
// ============================================================================

interface SummaryCardProps {
 label: string
 value: string
}

function SummaryCard({ label, value }: SummaryCardProps) {
 return (
   <Card>
     <CardContent className="p-4">
       <p className="text-sm text-gray-500 mb-1">{label}</p>
       <p className="text-2xl font-bold text-[#15803d]">{value}</p>
     </CardContent>
   </Card>
 )
}