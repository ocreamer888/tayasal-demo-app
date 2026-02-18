import {
 startOfDay,
 endOfDay,
 startOfWeek,
 endOfWeek,
 startOfMonth,
 endOfMonth,
 isValid,
 parseISO,
} from 'date-fns'

export interface DateRange {
 start: Date
 end: Date
}

export type CycleType = 'daily' | 'weekly' | 'monthly' | 'custom'

/**
 * Returns the appropriate date range based on the cycle type and reference date.
 * @param cycle - The cycle type (daily, weekly, monthly, custom)
 * @param referenceDate - The date to calculate from (defaults to today)
 * @returns DateRange object with start and end dates
 */
export function getDateRangeForCycle(
 cycle: CycleType,
 referenceDate: Date = new Date()
): DateRange {
 switch (cycle) {
   case 'daily':
     return getTodayRange(referenceDate)
   case 'weekly':
     return getCurrentWeekRange(referenceDate)
   case 'monthly':
     return getCurrentMonthRange(referenceDate)
   case 'custom':
     // For custom, return today as placeholder (should use explicit custom range)
     return getTodayRange(referenceDate)
   default:
     return getTodayRange(referenceDate)
 }
}

/**
 * Returns the date range for a specific day (midnight to midnight).
 * @param date - The date (defaults to today)
 * @returns DateRange with start and end at midnight
 */
export function getTodayRange(date: Date = new Date()): DateRange {
 const start = startOfDay(date)
 const end = endOfDay(date)
 return { start, end }
}

/**
 * Returns the date range for the current ISO week (Monday to Sunday).
 * @param referenceDate - Any date within the desired week (defaults to today)
 * @returns DateRange from Monday 00:00 to Sunday 23:59:59.999
 */
export function getCurrentWeekRange(referenceDate: Date = new Date()): DateRange {
 const start = startOfWeek(referenceDate, { weekStartsOn: 1 }) // Monday
 const end = endOfDay(endOfWeek(referenceDate, { weekStartsOn: 1 }))
 return { start, end }
}

/**
 * Returns the date range for the current month.
 * @param referenceDate - Any date within the desired month (defaults to today)
 * @returns DateRange from first day 00:00 to last day 23:59:59.999
 */
export function getCurrentMonthRange(referenceDate: Date = new Date()): DateRange {
 const start = startOfMonth(referenceDate)
 const end = endOfDay(endOfMonth(referenceDate))
 return { start, end }
}

/**
 * Validates and returns a custom date range.
 * Ensures start date is before or equal to end date.
 * @param startDate - The start date
 * @param endDate - The end date
 * @returns DateRange if valid
 * @throws Error if dates are invalid or start is after end
 */
export function getCustomRange(startDate: Date, endDate: Date): DateRange {
 // Validate dates
 if (!isValid(startDate)) {
   throw new Error('Fecha de inicio inválida')
 }

 if (!isValid(endDate)) {
   throw new Error('Fecha de fin inválida')
 }

 // Ensure start is before or equal to end
 if (startDate > endDate) {
   throw new Error('La fecha de inicio debe ser anterior o igual a la fecha de fin')
 }

 const start = startOfDay(startDate)
 const end = endOfDay(endDate)

 return { start, end }
}

/**
 * Parses ISO date strings to Date objects.
 * Useful for form input handling.
 * @param dateString - ISO date string (YYYY-MM-DD)
 * @returns Date object or null if invalid
 */
export function parseDateString(dateString: string): Date | null {
 if (!dateString) return null
 const date = parseISO(dateString)
 return isValid(date) ? date : null
}
