import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import type { ReportData } from '../../types/reports'
import { formatCurrencyCLP, formatDateES } from './report-data-aggregator'
import { parseISO } from 'date-fns'

/**
 * PDF Exporter for Tayasal Production Reports
 *
 * Generates professional PDF documents with cover page and tables.
 * Uses landscape orientation for optimal table fit.
 */

// ============================================================================
// Constants
// ============================================================================

const BRAND_GREEN = '#15803d' as const
const DARK_GREEN = '#14532d' as const
const LIGHT_GRAY = '#f9fafb'
const CONFIDENTIAL_TEXT = 'CONFIDENCIAL'

// ============================================================================
// Main Export Function
// ============================================================================

/**
 * Generates a PDF report and triggers download.
 */
export function exportToPDF(data: ReportData): void {
 // Create new PDF document (landscape for wider tables)
 const doc = new jsPDF({
   orientation: 'landscape',
   unit: 'mm',
   format: 'a4',
 })

 let yPosition = 0

 // 1. Cover Page
 yPosition = addCoverPage(doc, data)

 // 2. Executive Summary
 yPosition = addExecutiveSummary(doc, data, yPosition)

 // 3. Orders Table
 yPosition = addOrdersTable(doc, data, yPosition)

 // 4. Cost Analysis Table
 yPosition = addCostsTable(doc, data, yPosition)

 // 5. Inventory Table (if present)
 if (data.inventoryChanges && data.inventoryChanges.length > 0) {
   yPosition = addInventoryTable(doc, data, yPosition)
 }

 // 6. Add footer to all pages
 addFooterToAllPages(doc)

 // Generate filename
 const dateStamp = new Date().toISOString().slice(0, 10).replace(/-/g, '')
 const cycle = data.period.start.toISOString().slice(0, 7).replace(/-/g, '')
 const filename = `Tayasal_Produccion_${dateStamp}_ciclo_${cycle}.pdf`

 // Save PDF
 doc.save(filename)
}

// ============================================================================
// Cover Page
// ============================================================================

function addCoverPage(doc: jsPDF, data: ReportData): number {
 const pageWidth = doc.internal.pageSize.getWidth()
 const centerX = pageWidth / 2

 // Title
 doc.setFontSize(24)
 doc.setFont('helvetica', 'bold')
 doc.setTextColor(BRAND_GREEN)
 doc.text('Tayasal - Informe de Producción', centerX, 40, { align: 'center' })

 // Period
 doc.setFontSize(14)
 doc.setFont('helvetica', 'normal')
 doc.setTextColor(100)
 const periodText = `${formatDateES(data.period.start)} - ${formatDateES(data.period.end)}`
 doc.text(periodText, centerX, 55, { align: 'center' })

 // Generation date
 doc.setFontSize(11)
 const generatedText = `Generado: ${formatDateES(new Date())}`
 doc.text(generatedText, centerX, 65, { align: 'center' })

 // Horizontal line
 doc.setDrawColor(BRAND_GREEN)
 doc.setLineWidth(1.5)
 doc.line(30, 75, pageWidth - 30, 75)

 // Confidential label
 doc.setFontSize(10)
 doc.setTextColor(150)
 doc.text(CONFIDENTIAL_TEXT, centerX, 85, { align: 'center' })

 // Return bottom position
 return 95
}

// ============================================================================
// Executive Summary
// ============================================================================

function addExecutiveSummary(doc: jsPDF, data: ReportData, startY: number): number {
 let y = startY + 10

 // Section header
 doc.setFontSize(16)
 doc.setFont('helvetica', 'bold')
 doc.setTextColor(DARK_GREEN)
 doc.text('Resumen Ejecutivo', 20, y)
 y += 10

 // Decorative line
 doc.setDrawColor(BRAND_GREEN)
 doc.setLineWidth(0.5)
 doc.line(20, y - 4, 80, y - 4)

 // Metrics grid (2 columns)
 doc.setFontSize(10)
 doc.setFont('helvetica', 'normal')
 doc.setTextColor(60)

 const metrics = [
   { label: 'Órdenes de Producción', value: data.summary.totalOrders.toString() },
   { label: 'Bloques Producidos', value: data.summary.totalBlocks.toLocaleString('es-CL') },
   { label: 'Costo Total', value: formatCurrencyCLP(data.summary.totalCost) },
   { label: 'Costo Promedio por Bloque', value: formatCurrencyCLP(data.summary.avgCostPerBlock) },
   {
     label: 'Bloques por Hora',
     value: data.summary.blocksPerHour.toFixed(2),
   },
   { label: 'Tipo Más Producido', value: data.summary.topBlockType },
 ]

 const colX = [20, 120] // left column start, right column start
 const lineHeight = 8
 let rowY = y

 metrics.forEach((metric, i) => {
   const col = i % 2
   const x = colX[col]
   const isLeftCol = col === 0

   // Label
   doc.setFontSize(9)
   doc.setTextColor(100)
   doc.text(metric.label, x, rowY)

   // Value
   doc.setFontSize(11)
   doc.setFont('helvetica', 'bold')
   doc.setTextColor(DARK_GREEN)
   doc.text(metric.value, x + 60, rowY)

   // Move to next row if left column
   if (isLeftCol) {
     rowY += lineHeight
   } else {
     // After right column, reset rowY for next pair (or if odd count)
     if (i % 2 === 1) rowY += lineHeight
   }
 })

 y = rowY + 15
 return y
}

// ============================================================================
// Orders Table
// ============================================================================

function addOrdersTable(doc: jsPDF, data: ReportData, startY: number): number {
 doc.setFontSize(16)
 doc.setFont('helvetica', 'bold')
 doc.setTextColor(DARK_GREEN)
 doc.text('Órdenes de Producción', 20, startY)
 startY += 10

 // Table columns
 const headers = [
   'ID',
   'Fecha',
   'Tipo',
   'Cant.',
   'Mat.',
   'Mano Obra',
   'Equipo',
   'Total',
   'Operario',
 ]

 // Map orders to table rows
 const rows = data.orders.map((order) => [
   order.id,
   formatDateES(parseISO(order.createdAt)),
   order.block_type,
   order.quantity_produced.toString(),
   formatCurrencyCLP(order.material_cost),
   formatCurrencyCLP(order.labor_cost),
   formatCurrencyCLP(order.equipment_cost),
   formatCurrencyCLP(order.total_cost),
   order.created_by_name,
 ])

 // autoTable configuration
 autoTable(doc, {
   startY: startY,
   head: [headers],
   body: rows,
   theme: 'grid',
   headStyles: {
     fillColor: BRAND_GREEN,
     textColor: [255, 255, 255],
     fontStyle: 'bold',
     halign: 'center',
   },
   bodyStyles: {
     halign: 'left',
     fontSize: 9,
   },
   alternateRowStyles: {
     fillColor: LIGHT_GRAY as any,
   },
   columnStyles: {
     // ID column
     0: { cellWidth: 25, halign: 'center' },
     // Fecha
     1: { cellWidth: 18, halign: 'center' },
     // Tipo
     2: { cellWidth: 20 },
     // Cantidad
     3: { cellWidth: 12, halign: 'right' },
     // Costs columns
     4: { cellWidth: 18, halign: 'right' },
     5: { cellWidth: 18, halign: 'right' },
     6: { cellWidth: 18, halign: 'right' },
     7: { cellWidth: 18, halign: 'right', fontStyle: 'bold' },
     // Operario
     8: { cellWidth: 30 },
   },
   margin: { left: 20, right: 20 },
   didParseCell: function (data: any) {
     // Bold total column
     if (data.column.index === 7 && data.row.section === 'body') {
       data.cell.styles.fontStyle = 'bold'
       data.cell.styles.textColor = DARK_GREEN
     }
   },
 })

 const endY = (doc as any).lastAutoTable.finalY + 15
 return endY
}

// ============================================================================
// Cost Analysis Table
// ============================================================================

function addCostsTable(doc: jsPDF, data: ReportData, startY: number): number {
 doc.setFontSize(16)
 doc.setFont('helvetica', 'bold')
 doc.setTextColor(DARK_GREEN)
 doc.text('Análisis de Costos', 20, startY)
 startY += 10

 const total =
   data.costsByCategory.materials +
   data.costsByCategory.labor +
   data.costsByCategory.equipment +
   data.costsByCategory.energy +
   data.costsByCategory.maintenance

 const headers = ['Categoría', 'Monto (CLP)', '% del Total']

 const body = [
   ['Materiales', formatCurrencyCLP(data.costsByCategory.materials)],
   ['Mano de Obra', formatCurrencyCLP(data.costsByCategory.labor)],
   ['Equipo', formatCurrencyCLP(data.costsByCategory.equipment)],
   ['Energía', formatCurrencyCLP(data.costsByCategory.energy)],
   ['Mantenimiento', formatCurrencyCLP(data.costsByCategory.maintenance)],
   ['TOTAL', formatCurrencyCLP(total), '100%'],
 ]

 autoTable(doc, {
   startY,
   head: [headers],
   body: body,
   theme: 'grid',
   headStyles: {
     fillColor: BRAND_GREEN,
     textColor: [255, 255, 255],
     fontStyle: 'bold',
   },
   bodyStyles: {
     halign: 'right',
     fontSize: 10,
   },
   alternateRowStyles: {
     fillColor: LIGHT_GRAY as any,
   },
   columnStyles: {
     0: { halign: 'left', cellWidth: 40 },
     1: { halign: 'right', cellWidth: 30 },
     2: { halign: 'center', cellWidth: 20 },
   },
   didParseCell: function (data: any) {
     // Bold total row
     if (data.row.index === body.length - 1) {
       data.cell.styles.fontStyle = 'bold'
       data.cell.styles.fillColor = BRAND_GREEN
       data.cell.styles.textColor = [255, 255, 255]
     }
   },
   margin: { left: 20, right: 20 },
 })

 const endY = (doc as any).lastAutoTable.finalY + 15
 return endY
}

// ============================================================================
// Inventory Table
// ============================================================================

function addInventoryTable(doc: jsPDF, data: ReportData, startY: number): number {
 if (!data.inventoryChanges || data.inventoryChanges.length === 0) {
   return startY
 }

 doc.setFontSize(16)
 doc.setFont('helvetica', 'bold')
 doc.setTextColor(DARK_GREEN)
 doc.text('Impacto en Inventario', 20, startY)
 startY += 10

 const headers = ['Material', 'Unidad', 'Stock Inicial', 'Consumo', 'Stock Final', 'Costo Unit.', 'Valor Final']

 const body = data.inventoryChanges!.map((inv) => [
   inv.materialName,
   inv.unit,
   inv.stockInitial.toLocaleString('es-CL'),
   inv.quantityUsed.toLocaleString('es-CL'),
   inv.stockFinal.toLocaleString('es-CL'),
   formatCurrencyCLP(inv.unitCost),
   formatCurrencyCLP(inv.totalValue),
 ])

 autoTable(doc, {
   startY,
   head: [headers],
   body: body,
   theme: 'grid',
   headStyles: {
     fillColor: BRAND_GREEN,
     textColor: [255, 255, 255],
     fontStyle: 'bold',
   },
   bodyStyles: {
     halign: 'right',
     fontSize: 9,
   },
   alternateRowStyles: {
     fillColor: LIGHT_GRAY as any,
   },
   columnStyles: {
     0: { halign: 'left', cellWidth: 30 },
     1: { halign: 'center', cellWidth: 12 },
     2: { halign: 'right', cellWidth: 18 },
     3: { halign: 'right', cellWidth: 18 },
     4: { halign: 'right', cellWidth: 18 },
     5: { halign: 'right', cellWidth: 18 },
     6: { halign: 'right', cellWidth: 20 },
   },
   margin: { left: 20, right: 20 },
 })

 const endY = (doc as any).lastAutoTable.finalY + 15
 return endY
}

// ============================================================================
// Footer
// ============================================================================

function addFooterToAllPages(doc: jsPDF): void {
 const pageCount = doc.getNumberOfPages()
 const pageHeight = doc.internal.pageSize.getHeight()
 const pageWidth = doc.internal.pageSize.getWidth()

 for (let i = 1; i <= pageCount; i++) {
   doc.setPage(i)

   // Footer line
   doc.setDrawColor(200)
   doc.setLineWidth(0.2)
   doc.line(20, pageHeight - 15, pageWidth - 20, pageHeight - 15)

   // Confidential label (left)
   doc.setFontSize(8)
   doc.setTextColor(150)
   doc.text(CONFIDENTIAL_TEXT, 20, pageHeight - 10)

   // Page number (right)
   const pageNumText = `Página ${i} de ${pageCount}`
   doc.text(pageNumText, pageWidth - 20, pageHeight - 10, {
     align: 'right',
   })
 }
}