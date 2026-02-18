import type { ProductionOrder, InventoryMaterial } from './production-order';

/**
 * ReportGenerator Type Definitions
 *
 * Types for generating production reports with export capabilities.
 * Supports Excel and PDF exports with daily, weekly, monthly, and custom cycles.
 */

// ============================================================================
// Core Report Types
// ============================================================================

/**
 * Export format options
 */
export type ExportFormat = 'excel' | 'pdf' | 'both';

/**
 * Report cycle types
 */
export type CycleType = 'daily' | 'weekly' | 'monthly' | 'custom';

/**
 * Date range for report period
 */
export interface DateRange {
  start: Date;
  end: Date;
}

/**
 * Report sections to include in export
 */
export interface ReportSections {
  /** Include executive summary sheet */
  summary: boolean;
  /** Include orders detail sheet */
  orders: boolean;
  /** Include cost analysis sheet */
  costs: boolean;
  /** Include inventory impact sheet */
  inventory: boolean;
}

// ============================================================================
// Report Configuration
// ============================================================================

/**
 * User configuration for generating a report
 */
export interface ReportConfig {
  /** Date range for the report */
  dateRange: DateRange;
  /** Cycle type (affects how date range is calculated) */
  cycleType: CycleType;
  /** Which sections to include in the export */
  sections: ReportSections;
  /** Export format */
  format: ExportFormat;
  /** Enable preview before export */
  enablePreview?: boolean;
}

// ============================================================================
// Report Data Structures
// ============================================================================

/**
 * Summary metrics for the report period
 */
export interface ReportSummary {
  /** Total number of orders */
  totalOrders: number;
  /** Total blocks produced */
  totalBlocks: number;
  /** Total cost (CLP) */
  totalCost: number;
  /** Average cost per block (CLP) */
  avgCostPerBlock: number;
  /** Production rate (blocks per hour) */
  blocksPerHour: number;
  /** Most produced block type */
  topBlockType: string;
}

/**
 * Cost breakdown by category
 */
export interface CostsByCategory {
  /** Material costs */
  materials: number;
  /** Labor costs */
  labor: number;
  /** Equipment costs */
  equipment: number;
  /** Energy costs */
  energy: number;
  /** Maintenance costs */
  maintenance: number;
}

/**
 * Inventory snapshot showing usage during period
 */
export interface InventorySnapshot {
  /** Material ID */
  materialId: string;
  /** Material name */
  materialName: string;
  /** Unit of measurement */
  unit: string;
  /** Stock at start of period */
  stockInitial: number;
  /** Quantity used during period */
  quantityUsed: number;
  /** Stock at end of period */
  stockFinal: number;
  /** Unit cost (CLP) */
  unitCost: number;
  /** Total value (CLP) */
  totalValue: number;
}

/**
 * Complete aggregated report data
 */
export interface ReportData {
  /** Report period */
  period: DateRange;
  /** Production orders in period */
  orders: ProductionOrder[];
  /** Summary metrics */
  summary: ReportSummary;
  /** Cost breakdown by category */
  costsByCategory: CostsByCategory;
  /** Inventory changes during period (optional) */
  inventoryChanges?: InventorySnapshot[];
}

// ============================================================================
// Export Configuration
// ============================================================================

/**
 * Configuration for Excel/PDF export
 */
export interface ExportConfig {
  /** Report data to export */
  reportData: ReportData;
  /** User configuration */
  config: ReportConfig;
  /** Filename suffix (optional) */
  filename?: string;
}

/**
 * Template preset for quick report generation
 */
export interface ReportTemplate {
  /** Template name */
  name: string;
  /** Template description */
  description: string;
  /** Cycle type */
  cycleType: CycleType;
  /** Default sections */
  defaultSections: ReportSections;
  /** Default format */
  defaultFormat: ExportFormat;
}

// ============================================================================
// Component Props
// ============================================================================

/**
 * Props for ReportForm component
 */
export interface ReportFormProps {
  /** Initial configuration values */
  initialConfig?: Partial<ReportConfig>;
  /** Callback when form is submitted */
  onSubmit: (config: ReportConfig) => void;
  /** Whether data is currently being processed */
  isLoading?: boolean;
  /** Callback to trigger preview */
  onPreview?: () => void;
}

/**
 * Props for ReportPreview component
 */
export interface ReportPreviewProps {
  /** Aggregated report data (null if not yet generated) */
  reportData: ReportData | null;
  /** Whether modal is open */
  isOpen: boolean;
  /** Whether data is loading */
  isLoading: boolean;
  /** Callback to close modal */
  onClose: () => void;
  /** Callback to proceed with export */
  onExport: () => void;
}

/**
 * Props for ReportGenerator component
 */
export interface ReportGeneratorProps {
  /** Default configuration */
  defaultConfig?: Partial<ReportConfig>;
  /** Callback after successful export */
  onExportSuccess?: (filename: string) => void;
  /** Callback on export error */
  onExportError?: (error: Error) => void;
}

// ============================================================================
// Utility Types
// ============================================================================

/**
 * Status of report generation
 */
export type ReportGenerationStatus =
  | 'idle'
  | 'aggregating'
  | 'generating_excel'
  | 'generating_pdf'
  | 'complete'
  | 'error';

/**
 * Error types for report generation
 */
export interface ReportError {
  /** Error code */
  code: 'NO_DATA' | 'INVALID_RANGE' | 'NO_SECTIONS' | 'EXPORT_FAILED' | 'UNKNOWN';
  /** Error message */
  message: string;
  /** Additional details */
  details?: string;
}

/**
 * Progress information for long-running operations
 */
export interface ReportProgress {
  /** Current status */
  status: ReportGenerationStatus;
  /** Progress percentage (0-100) */
  percentage: number;
  /** Current operation description */
  message: string;
  /** Number of items processed */
  itemsProcessed?: number;
  /** Total items to process */
  totalItems?: number;
}
