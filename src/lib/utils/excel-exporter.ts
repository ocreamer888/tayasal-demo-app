import * as XLSX from 'xlsx-js-style'
import type { ReportData } from '../../types/reports'
import { formatCurrencyCLP, formatDateES } from './report-data-aggregator'
import { parseISO } from 'date-fns'

/**
 * Excel Exporter for Tayasal Production Reports
 *
 * Generates professional Excel workbooks with styled sheets.
 * Supports: Summary, Orders, Costs, Inventory sections.
 */

// ============================================================================
// Style Constants
// ============================================================================

const GREEN_HEADER = {
  font: { bold: true, color: { rgb: 'FFFFFF' } },
  fill: { fgColor: { rgb: '15803d' } }, // Tailwind green-700
  alignment: { horizontal: 'center' },
}

const DARK_GREEN_HEADER = {
  font: { bold: true, color: { rgb: 'FFFFFF' } },
  fill: { fgColor: { rgb: '14532d' } }, // Darker green
  alignment: { horizontal: 'center' },
}

const ALTERNATE_ROW = {
  fill: { fgColor: { rgb: 'f9fafb' } }, // Gray-50
}

const BORDER_STYLE = {
  top: { style: 'thin' },
  bottom: { style: 'thin' },
  left: { style: 'thin' },
  right: { style: 'thin' },
}

const TOTAL_ROW = {
  font: { bold: true },
  fill: { fgColor: { rgb: 'ecfccb' } }, // Light lime
  border: {
    top: { style: 'double' },
    bottom: { style: 'double' },
  },
}

// ============================================================================
// Sheet Builders
// ============================================================================

/**
 * Creates the summary/resumen sheet.
 */
function buildSummarySheet(workbook: XLSX.WorkBook, data: ReportData): void {
 const ws = XLSX.utils.aoa_to_sheet([])

 // Title
 XLSX.utils.sheet_add_aoa(ws, [['Tayasal - Informe de Producción']], {
   origin: 'A1',
 })
 ws['A1'].s = {
   font: { bold: true, size: 16, color: { rgb: '15803d' } },
   alignment: { horizontal: 'center' },
 }

 // Period info
 const periodText = `Periodo: ${formatDateES(data.period.start)} - ${formatDateES(data.period.end)}`
 XLSX.utils.sheet_add_aoa(ws, [[periodText]], { origin: 'A2' })
 ws['A2'].s = { font: { sz: 12 } }

 // Spacer
 XLSX.utils.sheet_add_aoa(ws, [['']], { origin: 'A3' })

 // Metrics table header
 const metricsHeaders = ['Métrica', 'Valor']
 XLSX.utils.sheet_add_aoa(ws, [metricsHeaders], { origin: 'A5' })
 ws['A5'].s = GREEN_HEADER
 ws['B5'].s = GREEN_HEADER

 // Metrics rows
 const metrics = [
   ['Órdenes de Producción', data.summary.totalOrders],
   ['Bloques Producidos', data.summary.totalBlocks],
   ['Costo Total', formatCurrencyCLP(data.summary.totalCost)],
   ['Costo Promedio por Bloque', formatCurrencyCLP(data.summary.avgCostPerBlock)],
   [
     'Bloques por Hora',
     data.summary.blocksPerHour.toFixed(2),
   ],
   ['Tipo de Bloque Más Producido', data.summary.topBlockType],
 ]

 XLSX.utils.sheet_add_aoa(ws, metrics, { origin: 'A6' })

 // Apply alternating rows and borders for metrics
 for (let i = 0; i < metrics.length; i++) {
   const rowIdx = 6 + i
   const isAlt = i % 2 === 1
   if (isAlt) {
     ws[`A${rowIdx}`].s = ALTERNATE_ROW
     ws[`B${rowIdx}`].s = ALTERNATE_ROW
   }
   ws[`A${rowIdx}`].s = {
     ...ws[`A${rowIdx}`].s,
     border: BORDER_STYLE,
   }
   ws[`B${rowIdx}`].s = {
     ...ws[`B${rowIdx}`].s,
     border: BORDER_STYLE,
   }
 }

 // Set column widths
 ws['!cols'] = [
   { wch: 30 }, // Column A
   { wch: 20 }, // Column B
 ]

 // Merge title cells
 if (!ws['!merges']) ws['!merges'] = []
 ws['!merges'].push({ s: { r: 0, c: 0 }, e: { r: 0, c: 1 } })
 ws['!merges'].push({ s: { r: 1, c: 0 }, e: { r: 1, c: 1 } })

 workbook.SheetNames.push('Resumen')
 workbook.Sheets['Resumen'] = ws
}

/**
 * Creates the orders detail sheet.
 */
function buildOrdersSheet(workbook: XLSX.WorkBook, data: ReportData): void {
 const ws = XLSX.utils.aoa_to_sheet([])

 // Title
 XLSX.utils.sheet_add_aoa(ws, [['Órdenes de Producción']], { origin: 'A1' })
 ws['A1'].s = {
   font: { bold: true, size: 16, color: { rgb: '15803d' } },
   alignment: { horizontal: 'center' },
 }

 // Spacer
 XLSX.utils.sheet_add_aoa(ws, [['']], { origin: 'A2' })

 // Headers
 const headers = [
   'ID',
   'Fecha',
   'Tipo',
   'Cantidad',
   'Estado',
   'Materiales',
   'Mano Obra',
   'Equipo',
   'Total',
   'Operario',
 ]
 XLSX.utils.sheet_add_aoa(ws, [headers], { origin: 'A4' })
 headers.forEach((_, idx) => {
   const cell = ws[XLSX.utils.encode_cell({ r: 3, c: idx })]
   cell.s = DARK_GREEN_HEADER
 })

 // Data rows
 const rows: (string | number)[][] = []
 data.orders.forEach((order) => {
   rows.push([
     order.id,
     formatDateES(parseISO(order.createdAt)),
     order.block_type,
     order.quantity_produced,
     order.status,
     formatCurrencyCLP(order.material_cost),
     formatCurrencyCLP(order.labor_cost),
     formatCurrencyCLP(order.equipment_cost),
     formatCurrencyCLP(order.total_cost),
     order.created_by_name,
   ])
 })

 XLSX.utils.sheet_add_aoa(ws, rows, { origin: 'A5' })

 // Apply alternating rows and borders
 rows.forEach((_, i) => {
   const rowIdx = 4 + i + 1 // +1 because we started at A5
   const isAlt = i % 2 === 1
   if (isAlt) {
     for (let c = 0; c < headers.length; c++) {
       const cellRef = XLSX.utils.encode_cell({ r: rowIdx - 1, c })
       if (!ws[cellRef]) ws[cellRef] = { v: '', t: 's' }
       ws[cellRef].s = ALTERNATE_ROW
     }
   }
   // Add borders to all cells
   for (let c = 0; c < headers.length; c++) {
     const cellRef = XLSX.utils.encode_cell({ r: rowIdx - 1, c })
     if (!ws[cellRef]) ws[cellRef] = { v: '', t: 's' }
     ws[cellRef].s = {
       ...ws[cellRef].s,
       border: BORDER_STYLE,
     }
   }
 })

 // Set column widths
 ws['!cols'] = [
   { wch: 12 }, // ID
   { wch: 12 }, // Fecha
   { wch: 15 }, // Tipo
   { wch: 10 }, // Cantidad
   { wch: 12 }, // Estado
   { wch: 14 }, // Materiales
   { wch: 12 }, // Mano Obra
   { wch: 10 }, // Equipo
   { wch: 12 }, // Total
   { wch: 15 }, // Operario
 ]

 workbook.SheetNames.push('Órdenes')
 workbook.Sheets['Órdenes'] = ws
}

/**
 * Creates the costs breakdown sheet.
 */
function buildCostsSheet(workbook: XLSX.WorkBook, data: ReportData): void {
 const ws = XLSX.utils.aoa_to_sheet([])

 // Title
 XLSX.utils.sheet_add_aoa(ws, [['Análisis de Costos']], { origin: 'A1' })
 ws['A1'].s = {
   font: { bold: true, size: 16, color: { rgb: '15803d' } },
   alignment: { horizontal: 'center' },
 }

 // Spacer
 XLSX.utils.sheet_add_aoa(ws, [['']], { origin: 'A2' })

 // Headers
 const headers = ['Categoría', 'Monto (CLP)', '% del Total']
 XLSX.utils.sheet_add_aoa(ws, [headers], { origin: 'A4' })
 headers.forEach((_, idx) => {
   ws[XLSX.utils.encode_cell({ r: 3, c: idx })].s = GREEN_HEADER
 })

 // Calculate total
 const total =
   data.costsByCategory.materials +
   data.costsByCategory.labor +
   data.costsByCategory.equipment +
   data.costsByCategory.energy +
   data.costsByCategory.maintenance

 // Data rows
 const categories = [
   ['Materiales', data.costsByCategory.materials],
   ['Mano de Obra', data.costsByCategory.labor],
   ['Equipo', data.costsByCategory.equipment],
   ['Energía', data.costsByCategory.energy],
   ['Mantenimiento', data.costsByCategory.maintenance],
 ]

 XLSX.utils.sheet_add_aoa(ws, categories, { origin: 'A5' })

 // Apply formatting and calculate percentages
 categories.forEach((cat, i) => {
   const rowIdx = 4 + i + 1
   const cellA = ws[`A${rowIdx}`]
   const cellB = ws[`B${rowIdx}`]

   // C column cells don't exist yet (categories only has 2 cols) — create them
   const amount = cat[1] as number
   const percentage = total > 0 ? amount / total : 0
   ws[`C${rowIdx}`] = { v: percentage, t: 'n' }
   const cellC = ws[`C${rowIdx}`]

   cellA.s = { ...cellA?.s, border: BORDER_STYLE }
   cellB.s = {
     ...cellB?.s,
     border: BORDER_STYLE,
     numFmt: '"$"#,##0', // CLP format approximation
   }
   cellC.s = {
     border: BORDER_STYLE,
     numFmt: '0.00%',
   }
 })

 // Total row
 const totalRowIdx = 4 + categories.length + 1
 XLSX.utils.sheet_add_aoa(ws, [['TOTAL', total, 1]], { origin: `A${totalRowIdx}` })
 const totalCellA = ws[`A${totalRowIdx}`]
 const totalCellB = ws[`B${totalRowIdx}`]
 const totalCellC = ws[`C${totalRowIdx}`]

 totalCellA.s = {
   border: TOTAL_ROW.border,
   font: { bold: true },
   fill: { fgColor: { rgb: 'ecfccb' } },
 }
 totalCellB.s = {
   border: TOTAL_ROW.border,
   font: { bold: true },
   numFmt: '"$"#,##0',
 }
 totalCellC.s = {
   border: TOTAL_ROW.border,
   font: { bold: true },
   numFmt: '0.00%',
 }

 // Merge total label
 if (!ws['!merges']) ws['!merges'] = []
 ws['!merges'].push({
   s: { r: totalRowIdx - 1, c: 0 },
   e: { r: totalRowIdx - 1, c: 1 },
 })

 // Column widths
 ws['!cols'] = [
   { wch: 20 },
   { wch: 18 },
   { wch: 12 },
 ]

 workbook.SheetNames.push('Costos')
 workbook.Sheets['Costos'] = ws
}

/**
 * Creates the inventory impact sheet (only if data exists).
 */
function buildInventorySheet(workbook: XLSX.WorkBook, data: ReportData): void {
 if (!data.inventoryChanges || data.inventoryChanges.length === 0) {
   return
 }

 const ws = XLSX.utils.aoa_to_sheet([])

 // Title
 XLSX.utils.sheet_add_aoa(ws, [['Impacto en Inventario']], { origin: 'A1' })
 ws['A1'].s = {
   font: { bold: true, size: 16, color: { rgb: '15803d' } },
   alignment: { horizontal: 'center' },
 }

 // Spacer
 XLSX.utils.sheet_add_aoa(ws, [['']], { origin: 'A2' })

 // Headers
 const headers = [
   'Material',
   'Unidad',
   'Stock Inicial',
   'Consumo',
   'Stock Final',
   'Costo Unit.',
   'Valor Final',
 ]
 XLSX.utils.sheet_add_aoa(ws, [headers], { origin: 'A4' })
 headers.forEach((_, idx) => {
   ws[XLSX.utils.encode_cell({ r: 3, c: idx })].s = GREEN_HEADER
 })

 // Data rows
 const rows: (string | number)[][] = data.inventoryChanges!.map((inv) => [
   inv.materialName,
   inv.unit,
   inv.stockInitial,
   inv.quantityUsed,
   inv.stockFinal,
   inv.unitCost,
   inv.totalValue,
 ])

 XLSX.utils.sheet_add_aoa(ws, rows, { origin: 'A5' })

 // Apply borders and number formatting
 rows.forEach((_, i) => {
   const rowIdx = 4 + i + 1
   for (let c = 0; c < headers.length; c++) {
   const cellRef = XLSX.utils.encode_cell({ r: rowIdx - 1, c })
     if (!ws[cellRef]) ws[cellRef] = { v: '', t: 's' }
     ws[cellRef].s = {
       ...ws[cellRef].s,
       border: BORDER_STYLE,
     }
   }

   // Numeric columns: Stock Initial, Consumo, Stock Final, Unit Cost, Total Value
   const numericCols = [2, 3, 4, 5, 6]
   numericCols.forEach((c) => {
     const cellRef = XLSX.utils.encode_cell({ r: rowIdx - 1, c })
     ws[cellRef].s = {
       ...ws[cellRef].s,
       numFmt: '"$"#,##0',
     }
   })
 })

 // Total row
 const totalConsumption = data.inventoryChanges!.reduce(
   (sum, inv) => sum + inv.quantityUsed,
   0
 )
 const totalValue = data.inventoryChanges!.reduce(
   (sum, inv) => sum + inv.totalValue,
   0
 )
 const totalRowIdx = 4 + rows.length + 1
 XLSX.utils.sheet_add_aoa(ws, [['TOTAL', '', totalConsumption, '', '', '', totalValue]], {
   origin: `A${totalRowIdx}`,
 })

 // Style total row
 for (let c = 0; c < headers.length; c++) {
   const cellRef = XLSX.utils.encode_cell({ r: totalRowIdx - 1, c })
   ws[cellRef].s = {
     ...TOTAL_ROW,
     border: {
       top: { style: 'double' },
       bottom: { style: 'double' },
     },
   }
 }

 // Columns
 ws['!cols'] = [
   { wch: 20 },
   { wch: 10 },
   { wch: 14 },
   { wch: 12 },
   { wch: 14 },
   { wch: 12 },
   { wch: 16 },
 ]

 workbook.SheetNames.push('Inventario')
 workbook.Sheets['Inventario'] = ws
}

// ============================================================================
// Main Export Function
// ============================================================================

/**
 * Generates an Excel file from report data and triggers download.
 */
export function exportToExcel(data: ReportData): void {
 // Create workbook
 const workbook: XLSX.WorkBook = { SheetNames: [], Sheets: {} }

 // Build requested sheets
 buildSummarySheet(workbook, data)
 buildOrdersSheet(workbook, data)
 buildCostsSheet(workbook, data)
 buildInventorySheet(workbook, data)

 // Generate filename
 const dateStamp = XLSX.SSF.format('yyyymmdd', new Date())
 const cycleType = data.period.start.toISOString().slice(0, 7) // YYYY-MM
 const filename = `Tayasal_Produccion_${dateStamp}_ciclo_${cycleType}.xlsx`

 // Write to binary string
 const wbout = XLSX.write(workbook, { bookType: 'xlsx', type: 'binary' })

 // Convert to Blob and download
 const blob = new Blob([s2ab(wbout)], {
   type:
     'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8',
 })

 downloadFile(blob, filename)
}

/**
 * Helper: String to ArrayBuffer conversion for Excel binary output.
 */
function s2ab(s: string): ArrayBuffer {
 const buf = new ArrayBuffer(s.length)
 const view = new Uint8Array(buf)
 for (let i = 0; i < s.length; i++) {
   view[i] = s.charCodeAt(i) & 0xff
 }
 return buf
}

/**
 * Helper: Triggers file download via anchor element.
 */
function downloadFile(blob: Blob, filename: string): void {
 const url = URL.createObjectURL(blob)
 const link = document.createElement('a')
 link.href = url
 link.download = filename
 document.body.appendChild(link)
 link.click()
 document.body.removeChild(link)
 URL.revokeObjectURL(url)
}

// ============================================================================
// Formatting Helpers
// ============================================================================

export { formatCurrencyCLP, formatDateES }
