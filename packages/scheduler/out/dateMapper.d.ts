import { CalendarConfig, ResourceCalendar, DateAxisEntry } from './types.js';
/**
 * Convert an abstract working-day offset to an ISO calendar date.
 *
 * Offset 0 = project start date (which must be a working day for the resource).
 * Offset N = the Nth working day after start.
 *
 * If a resourceCalendar is provided, uses their workdays + PTO.
 * Otherwise uses the project default workdays.
 */
export declare function offsetToDate(offset: number, config: CalendarConfig, resourceCalendar?: ResourceCalendar): string;
/**
 * Convert an ISO calendar date to a working-day offset from the project start.
 * Uses project default workdays (no resource-specific calendar).
 */
export declare function dateToOffset(date: string, config: CalendarConfig): number;
/**
 * Build the full calendar date axis for Gantt rendering.
 *
 * Generates one entry per calendar day from project start through `endDate`,
 * marking each as working / weekend / holiday.
 */
export declare function buildDateAxis(config: CalendarConfig, endDate: string): DateAxisEntry[];
