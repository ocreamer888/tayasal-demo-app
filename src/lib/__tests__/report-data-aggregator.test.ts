import { describe, it, expect } from 'vitest'
import {
 filterOrdersByDate,
 calculateSummary,
 aggregateCosts,
 calculateInventoryChanges,
 aggregateReportData,
 formatCurrencyCLP,
 formatDateES,
} from '../utils/report-data-aggregator'
import type { ProductionOrder, MaterialUsage } from '@/types/production-order'
import type { InventoryMaterial } from '@/types/inventory'
import type { ReportConfig, DateRange } from '@/types/reports'
import { parseISO, startOfDay, endOfDay } from 'date-fns'

// ============================================================================
// Test Data Factory Functions
// ============================================================================

function createOrder(
 id: string,
 createdAt: string,
 quantity: number,
 blockType: string,
 totalCost: number,
 materialCost: number,
 laborCost: number,
 equipmentCost: number,
 energyCost: number,
 maintenanceCost: number,
 durationMinutes: number,
 materialsUsed: MaterialUsage[] = []
): ProductionOrder {
 return {
   id,
   user_id: 'user-123',
   created_by_name: 'Test User',
   block_type: blockType,
   block_size: '15x20x40',
   quantity_produced: quantity,
   production_date: createdAt,
   production_shift: 'morning',
   start_time: '06:00',
   end_time: '14:00',
   duration_minutes: durationMinutes,
   concrete_plant_id: 'plant-1',
   materials_used: materialsUsed,
   equipment_used: [],
   team_assigned: [],
   material_cost: materialCost,
   labor_cost: laborCost,
   energy_cost: energyCost,
   maintenance_cost: maintenanceCost,
   equipment_cost: equipmentCost,
   total_cost: totalCost,
   status: 'approved',
   createdAt,
   updatedAt: createdAt,
 }
}

function createInventoryMaterial(
 id: string,
 name: string,
 quantity: number,
 unitCost: number,
 unit: string = 'kg'
): InventoryMaterial {
 return {
   id,
   user_id: 'user-123',
   material_name: name,
   category: 'cement',
   unit,
   current_quantity: quantity,
   unit_cost: unitCost,
   min_stock_quantity: 100,
   location: 'Warehouse A',
   last_updated: new Date().toISOString(),
   created_at: new Date().toISOString(),
   updated_at: new Date().toISOString(),
 }
}

// ============================================================================
// Sample Test Data
// ============================================================================

// Create orders on different dates
const orders: ProductionOrder[] = [
 createOrder(
   'order-1',
   '2026-02-10T10:00:00Z',
   100,
   'Block A',
   500000,
   200000,
   150000,
   50000,
   30000,
   20000,
   480, // 8 hours
   [
     { materialId: 'mat-1', materialName: 'Cement', quantity: 100, unit: 'kg', unitCost: 1000 },
   ]
 ),
 createOrder(
   'order-2',
   '2026-02-12T10:00:00Z',
   200,
   'Block B',
   800000,
   300000,
   250000,
   80000,
   50000,
   30000,
   360, // 6 hours
   [
     { materialId: 'mat-2', materialName: 'Sand', quantity: 200, unit: 'kg', unitCost: 500 },
   ]
 ),
 createOrder(
   'order-3',
   '2026-02-15T10:00:00Z',
   150,
   'Block A',
   600000,
   250000,
   180000,
   60000,
   40000,
   25000,
   420, // 7 hours
   [
     { materialId: 'mat-1', materialName: 'Cement', quantity: 150, unit: 'kg', unitCost: 1000 },
     { materialId: 'mat-2', materialName: 'Sand', quantity: 150, unit: 'kg', unitCost: 500 },
   ]
 ),
 createOrder(
   'order-4',
   '2026-02-20T10:00:00Z',
   300,
   'Block C',
   1200000,
   400000,
   350000,
   120000,
   150000,
   50000,
   540, // 9 hours
   []
 ),
]

const inventoryMaterials: InventoryMaterial[] = [
 createInventoryMaterial('mat-1', 'Cement', 1000, 1000),
 createInventoryMaterial('mat-2', 'Sand', 2000, 500),
 createInventoryMaterial('mat-3', 'Aggregate', 5000, 300),
]

// ============================================================================
// Unit Tests
// ============================================================================

describe('filterOrdersByDate', () => {
 it('should filter orders within date range', () => {
   const start = parseISO('2026-02-10T00:00:00Z')
   const end = parseISO('2026-02-15T23:59:59Z')

   const result = filterOrdersByDate(orders, start, end)

   expect(result).toHaveLength(3)
   expect(result.map((o) => o.id)).toContain('order-1')
   expect(result.map((o) => o.id)).toContain('order-2')
   expect(result.map((o) => o.id)).toContain('order-3')
   expect(result.map((o) => o.id)).not.toContain('order-4')
 })

 it('should return empty array when no orders match', () => {
   const start = parseISO('2025-01-01T00:00:00Z')
   const end = parseISO('2025-01-31T23:59:59Z')

   const result = filterOrdersByDate(orders, start, end)

   expect(result).toHaveLength(0)
 })

 it('should include orders on boundary dates', () => {
   const start = parseISO('2026-02-10T00:00:00Z')
   const end = parseISO('2026-02-10T23:59:59Z')

   const result = filterOrdersByDate(orders, start, end)

   expect(result).toHaveLength(1)
   expect(result[0].id).toBe('order-1')
 })
})

describe('calculateSummary', () => {
 it('should calculate correct summary from multiple orders', () => {
   const testOrders = orders.slice(0, 3) // orders 1-3
   const summary = calculateSummary(testOrders)

   expect(summary.totalOrders).toBe(3)
   expect(summary.totalBlocks).toBe(450) // 100 + 200 + 150
   expect(summary.totalCost).toBe(1900000) // 500k + 800k + 600k

   // Avg cost per block = 1,900,000 / 450 ≈ 4222.22
   expect(summary.avgCostPerBlock).toBeCloseTo(4222.22, 0)

   // Total minutes = 480 + 360 + 420 = 1260 minutes = 21 hours
   // blocksPerHour = 450 / 21 ≈ 21.43
   expect(summary.blocksPerHour).toBeCloseTo(21.43, 0)

   // Most frequent block type: 'Block A' appears 2 times, 'Block B' appears 1
   expect(summary.topBlockType).toBe('Block A')
 })

 it('should return N/A for topBlockType with no orders', () => {
   const summary = calculateSummary([])

   expect(summary.totalOrders).toBe(0)
   expect(summary.totalBlocks).toBe(0)
   expect(summary.totalCost).toBe(0)
   expect(summary.avgCostPerBlock).toBe(0)
   expect(summary.blocksPerHour).toBe(0)
   expect(summary.topBlockType).toBe('N/A')
 })

 it('should handle single order', () => {
   const summary = calculateSummary([orders[0]])

   expect(summary.totalOrders).toBe(1)
   expect(summary.totalBlocks).toBe(100)
   expect(summary.totalCost).toBe(500000)
   expect(summary.avgCostPerBlock).toBe(5000)
   expect(summary.blocksPerHour).toBeCloseTo(12.5, 0) // 100 blocks / (480/60 = 8 hours)
   expect(summary.topBlockType).toBe('Block A')
 })

 it('should return 0 for blocksPerHour with zero duration', () => {
   const zeroDurationOrder = { ...orders[0], duration_minutes: 0 }
   const summary = calculateSummary([zeroDurationOrder])

   expect(summary.blocksPerHour).toBe(0)
 })
})

describe('aggregateCosts', () => {
 it('should sum all cost categories correctly', () => {
   const testOrders = orders.slice(0, 2)
   const costs = aggregateCosts(testOrders)

   // Order 1: material=200k, labor=150k, equipment=50k, energy=30k, maintenance=20k
   // Order 2: material=300k, labor=250k, equipment=80k, energy=50k, maintenance=30k
   expect(costs.materials).toBe(200000 + 300000)
   expect(costs.labor).toBe(150000 + 250000)
   expect(costs.equipment).toBe(50000 + 80000)
   expect(costs.energy).toBe(30000 + 50000)
   expect(costs.maintenance).toBe(20000 + 30000)
 })

 it('should return zeros for empty orders', () => {
   const costs = aggregateCosts([])

   expect(costs.materials).toBe(0)
   expect(costs.labor).toBe(0)
   expect(costs.equipment).toBe(0)
   expect(costs.energy).toBe(0)
   expect(costs.maintenance).toBe(0)
 })
})

describe('calculateInventoryChanges', () => {
 it('should calculate inventory consumption correctly', () => {
   const testOrders = orders.slice(0, 2) // order-1 (100 cement) and order-2 (200 sand)
   const inventory = inventoryMaterials

   const result = calculateInventoryChanges(testOrders, inventory)

   expect(result).toHaveLength(2)

   // Cement used: 100 (order-1) + 0 (order-2) = 100
   const cementSnapshot = result.find((s) => s.materialId === 'mat-1')
   expect(cementSnapshot).toBeDefined()
   expect(cementSnapshot!.quantityUsed).toBe(100)
   expect(cementSnapshot!.stockInitial).toBe(1000 + 100) // current + used
   expect(cementSnapshot!.stockFinal).toBe(1000)
   expect(cementSnapshot!.unitCost).toBe(1000)
   expect(cementSnapshot!.totalValue).toBe(1000 * 1000)

   // Sand used: 0 + 200 = 200
   const sandSnapshot = result.find((s) => s.materialId === 'mat-2')
   expect(sandSnapshot).toBeDefined()
   expect(sandSnapshot!.quantityUsed).toBe(200)
   expect(sandSnapshot!.stockInitial).toBe(2000 + 200)
   expect(sandSnapshot!.stockFinal).toBe(2000)
 })

 it('should exclude materials with zero consumption', () => {
   const testOrders = orders.slice(0, 1) // only uses cement
   const inventory = inventoryMaterials

   const result = calculateInventoryChanges(testOrders, inventory)

   expect(result).toHaveLength(1)
   expect(result[0].materialId).toBe('mat-1')
   expect(result.find((s) => s.materialId === 'mat-2')).toBeUndefined()
   expect(result.find((s) => s.materialId === 'mat-3')).toBeUndefined()
 })

 it('should handle multiple orders using same material', () => {
   // order-1 uses 100 cement, order-3 uses 150 cement
   const testOrders = [orders[0], orders[2]]
   const result = calculateInventoryChanges(testOrders, inventoryMaterials)

   const cementSnapshot = result.find((s) => s.materialId === 'mat-1')
   expect(cementSnapshot!.quantityUsed).toBe(250) // 100 + 150
   expect(cementSnapshot!.stockInitial).toBe(1000 + 250)
 })
})

describe('aggregateReportData', () => {
 const defaultConfig: ReportConfig = {
   dateRange: {
     start: startOfDay(parseISO('2026-02-10')),
     end: endOfDay(parseISO('2026-02-15')),
   },
   cycleType: 'custom',
   sections: {
     summary: true,
     orders: true,
     costs: true,
     inventory: true,
   },
   format: 'excel',
 }

 it('should aggregate complete report data with all sections', () => {
   const reportData = aggregateReportData(defaultConfig, orders, inventoryMaterials)

   // Period matches config
   expect(reportData.period).toEqual(defaultConfig.dateRange)

   // Orders filtered correctly
   expect(reportData.orders).toHaveLength(3)
   expect(reportData.orders.map((o) => o.id)).toContain('order-1')
   expect(reportData.orders.map((o) => o.id)).toContain('order-2')
   expect(reportData.orders.map((o) => o.id)).toContain('order-3')

   // Summary
   expect(reportData.summary.totalOrders).toBe(3)
   expect(reportData.summary.totalBlocks).toBe(450)

   // Costs
   expect(reportData.costsByCategory.materials).toBeGreaterThan(0)

   // Inventory
   expect(reportData.inventoryChanges).toBeDefined()
   expect(reportData.inventoryChanges!.length).toBeGreaterThan(0)
 })

 it('should exclude inventory section when disabled', () => {
   const configWithoutInventory: ReportConfig = {
     ...defaultConfig,
     sections: { ...defaultConfig.sections, inventory: false },
   }

   const reportData = aggregateReportData(configWithoutInventory, orders, inventoryMaterials)

   expect(reportData.inventoryChanges).toBeUndefined()
 })

 it('should handle empty orders array', () => {
   const reportData = aggregateReportData(defaultConfig, [], inventoryMaterials)

   expect(reportData.orders).toHaveLength(0)
   expect(reportData.summary.totalOrders).toBe(0)
   expect(reportData.summary.totalBlocks).toBe(0)
   expect(reportData.summary.totalCost).toBe(0)
 })

 it('should throw error if dateRange is missing', () => {
   const invalidConfig: ReportConfig = {
     ...defaultConfig,
     dateRange: { start: new Date(), end: new Date() }, // This will be undefined after delete
   }
   delete (invalidConfig as Partial<ReportConfig>).dateRange

   expect(() =>
     aggregateReportData(invalidConfig, orders, inventoryMaterials)
   ).toThrow('Configuration must include dateRange')
 })
})

describe('formatCurrencyCLP', () => {
 it('should format currency with CLP style', () => {
   const formatted = formatCurrencyCLP(1234567)

   // es-CL format: $1.234.567 (no decimals)
   expect(formatted).toContain('1')
   expect(formatted).toContain('234')
   expect(formatted).toContain('567')
   expect(formatted).toMatch(/\$.*1.*234.*567/)
 })
})

describe('formatDateES', () => {
 it('should format date as DD/MM/YYYY', () => {
   const date = parseISO('2026-02-15T10:00:00Z')
   const formatted = formatDateES(date)

   expect(formatted).toBe('15/02/2026')
 })
})

// ============================================================================
// Integration Tests
// ============================================================================

describe('Integration: Full Report Generation', () => {
 it('should generate a daily report with today data', () => {
   // Simulate config for today
   const todayRange: DateRange = {
     start: startOfDay(new Date()),
     end: endOfDay(new Date()),
   }

   const config: ReportConfig = {
     dateRange: todayRange,
     cycleType: 'daily',
     sections: {
       summary: true,
       orders: true,
       costs: true,
       inventory: false,
     },
     format: 'excel',
   }

   // Use only orders from today (manually filter to ensure we have some)
   const todayOrders = orders.filter((o) => {
     const orderDate = parseISO(o.createdAt)
     return orderDate >= todayRange.start && orderDate <= todayRange.end
   })

   const reportData = aggregateReportData(config, todayOrders, [])

   expect(reportData.summary.totalOrders).toBe(todayOrders.length)
   expect(reportData.period).toEqual(todayRange)
 })

 it('should generate a monthly report spanning multiple weeks', () => {
   const febStart = startOfDay(parseISO('2026-02-01'))
   const febEnd = endOfDay(parseISO('2026-02-28'))

   const config: ReportConfig = {
     dateRange: { start: febStart, end: febEnd },
     cycleType: 'monthly',
     sections: {
       summary: true,
       orders: true,
       costs: true,
       inventory: true,
     },
     format: 'pdf',
   }

   const reportData = aggregateReportData(config, orders, inventoryMaterials)

   // All orders in February should be included
   expect(reportData.orders.length).toBeGreaterThanOrEqual(3)
   expect(reportData.summary.totalBlocks).toBeGreaterThan(0)
 })
})
