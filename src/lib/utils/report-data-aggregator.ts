import type {
 ProductionOrder,
 MaterialUsage,
} from '@/types/production-order'
import type { InventoryMaterial } from '@/types/inventory'
import type {
 ReportData,
 ReportSummary,
 CostsByCategory,
 InventorySnapshot,
 ReportConfig,
 ReportSections,
} from '@/types/reports'
import { getCustomRange } from './report-templates'
import { parseISO, isWithinInterval, startOfDay, endOfDay } from 'date-fns'

/**
 * Report Data Aggregator
 *
 * Aggregates production data from orders into report-ready structures.
 * Handles filtering, summarization, cost analysis, and inventory tracking.
 */

// ============================================================================
// Date Filtering
// ============================================================================

/**
 * Filters production orders by creation date within the specified range.
 * @param orders - Array of production orders
 * @param startDate - Start of reporting period (inclusive)
 * @param endDate - End of reporting period (inclusive)
 * @returns Filtered array of orders
 */
export function filterOrdersByDate(
 orders: ProductionOrder[],
 startDate: Date,
 endDate: Date
): ProductionOrder[] {
 // Ensure we use start of day and end of day for comparison
 const rangeStart = startOfDay(startDate)
 const rangeEnd = endOfDay(endDate)

 return orders.filter((order) => {
   const orderDate = parseISO(order.createdAt)
   return isWithinInterval(orderDate, { start: rangeStart, end: rangeEnd })
 })
}

// ============================================================================
// Summary Calculations
// ============================================================================

/**
 * Calculates summary metrics from an array of orders.
 * Handles edge cases: empty array, division by zero.
 *
 * @param orders - Array of production orders
 * @returns Summary metrics object
 */
export function calculateSummary(orders: ProductionOrder[]): ReportSummary {
 const totalOrders = orders.length

 // Calculate total blocks produced
 const totalBlocks = orders.reduce((sum, order) => sum + order.quantity_produced, 0)

 // Calculate total cost
 const totalCost = orders.reduce((sum, order) => sum + order.total_cost, 0)

 // Calculate average cost per block (avoid division by zero)
 const avgCostPerBlock = totalBlocks > 0 ? totalCost / totalBlocks : 0

 // Calculate blocks per hour from duration
 const totalMinutes = orders.reduce((sum, order) => sum + order.duration_minutes, 0)
 const blocksPerHour = totalMinutes > 0 ? (totalBlocks / (totalMinutes / 60)) : 0

 // Find most frequent block type
 const topBlockType = findMostFrequentBlockType(orders)

 return {
   totalOrders,
   totalBlocks,
   totalCost,
   avgCostPerBlock,
   blocksPerHour,
   topBlockType,
 }
}

/**
 * Helper to find the most frequently produced block type.
 * Returns the block type string or 'N/A' if no orders.
 */
function findMostFrequentBlockType(orders: ProductionOrder[]): string {
 if (orders.length === 0) return 'N/A'

 const frequency = new Map<string, number>()

 orders.forEach((order) => {
   const type = order.block_type || 'Sin especificar'
   frequency.set(type, (frequency.get(type) || 0) + 1)
 })

 // Find max frequency
 let maxCount = 0
 let topType = 'Sin especificar'

 frequency.forEach((count, type) => {
   if (count > maxCount) {
     maxCount = count
     topType = type
   }
 })

 return topType
}

// ============================================================================
// Cost Aggregation
// ============================================================================

/**
 * Aggregates costs by category across all orders.
 *
 * @param orders - Array of production orders
 * @returns Costs breakdown by category
 */
export function aggregateCosts(orders: ProductionOrder[]): CostsByCategory {
 return {
   materials: orders.reduce((sum, order) => sum + order.material_cost, 0),
   labor: orders.reduce((sum, order) => sum + order.labor_cost, 0),
   equipment: orders.reduce((sum, order) => sum + order.equipment_cost, 0),
   energy: orders.reduce((sum, order) => sum + order.energy_cost, 0),
   maintenance: orders.reduce((sum, order) => sum + order.maintenance_cost, 0),
 }
}

// ============================================================================
// Inventory Calculations
// ============================================================================

/**
 * Calculates inventory changes based on material consumption during the period.
 *
 * @param orders - Production orders within the reporting period
 * @param inventoryMaterials - Current inventory state (before report generation)
 * @returns Array of inventory snapshots showing before/after
 */
export function calculateInventoryChanges(
 orders: ProductionOrder[],
 inventoryMaterials: InventoryMaterial[]
): InventorySnapshot[] {
 // Step 1: Aggregate consumption per material from all orders
 const consumptionByMaterial = new Map<string, number>()

 orders.forEach((order) => {
   order.materials_used.forEach((usage: MaterialUsage) => {
     const current = consumptionByMaterial.get(usage.materialId) || 0
     consumptionByMaterial.set(usage.materialId, current + usage.quantity)
   })
 })

 // Step 2: Build inventory snapshots (map + filter to handle nulls)
 const snapshots: InventorySnapshot[] = inventoryMaterials
   .map((material) => {
     const quantityUsed = consumptionByMaterial.get(material.id) || 0

     // Only include materials that were consumed
     if (quantityUsed === 0) {
       return null
     }

     const stockInitial = material.current_quantity + quantityUsed
     const stockFinal = material.current_quantity

     const snapshot: InventorySnapshot = {
       materialId: material.id,
       materialName: material.material_name,
       unit: material.unit,
       stockInitial,
       quantityUsed,
       stockFinal,
       unitCost: material.unit_cost,
       totalValue: stockFinal * material.unit_cost,
     }

     return snapshot
   })
   .filter((s): s is InventorySnapshot => s !== null)

 return snapshots
}

// ============================================================================
// Main Aggregator
// ============================================================================

/**
 * Main function to aggregate all report data from configuration.
 * Returns a complete ReportData object ready for export.
 *
 * @param config - Report configuration with date range and sections
 * @param allOrders - All production orders (will be filtered by date)
 * @param inventoryMaterials - Current inventory state (for inventory section)
 * @returns Aggregated report data
 * @throws Error if configuration is invalid
 */
export function aggregateReportData(
 config: ReportConfig,
 allOrders: ProductionOrder[],
 inventoryMaterials: InventoryMaterial[] = []
): ReportData {
 // Validate config
 if (!config.dateRange) {
   throw new Error('Configuration must include dateRange')
 }

 // Filter orders by date
 const ordersInPeriod = filterOrdersByDate(
   allOrders,
   config.dateRange.start,
   config.dateRange.end
 )

 // Calculate summary metrics
 const summary = calculateSummary(ordersInPeriod)

 // Aggregate costs by category
 const costsByCategory = aggregateCosts(ordersInPeriod)

 // Build result object
 const reportData: ReportData = {
   period: config.dateRange,
   orders: ordersInPeriod,
   summary,
   costsByCategory,
 }

 // Add inventory changes if section is enabled
 if (
   config.sections?.inventory &&
   inventoryMaterials.length > 0 &&
   ordersInPeriod.length > 0
 ) {
   const inventoryChanges = calculateInventoryChanges(
     ordersInPeriod,
     inventoryMaterials
   )
   reportData.inventoryChanges = inventoryChanges
 }

 return reportData
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Formats a number as CLP currency.
 * Example: 1500000 -> "$1.500.000"
 */
export function formatCurrencyCLP(amount: number): string {
 return new Intl.NumberFormat('es-CL', {
   style: 'currency',
   currency: 'CLP',
   minimumFractionDigits: 0,
   maximumFractionDigits: 0,
 }).format(amount)
}

import { format } from 'date-fns'

/**
 * Formats a date as DD/MM/YYYY.
 */
export function formatDateES(date: Date): string {
 return format(date, 'dd/MM/yyyy')
}

/**
 * Safely gets the production date from an order.
 * Returns a Date object or null if invalid.
 */
export function getProductionDate(order: ProductionOrder): Date | null {
 try {
   return parseISO(order.production_date)
 } catch {
   return null
 }
}
