import { Weekday } from './types.js';
/** Parse a weekday string to our Weekday type. Case-insensitive. */
export declare function parseWeekday(s: string): Weekday;
/** Parse a comma-separated workdays string like "m,t,w,th,f". */
export declare function parseWorkdays(s: string): Weekday[];
/** Get the JS Date.getDay() index for a weekday. */
export declare function weekdayIndex(d: Weekday): number;
/** Get the Weekday abbreviation for a JS Date. */
export declare function dateToWeekday(date: Date): Weekday;
/** Format a Date to ISO string "YYYY-MM-DD" in local time. */
export declare function toIsoDate(date: Date): string;
/** Parse an ISO date string "YYYY-MM-DD" to a Date at midnight local time. */
export declare function fromIsoDate(iso: string): Date;
/** Check if a date is a working day given a workdays set and holidays. */
export declare function isWorkingDay(date: Date, workdays: Set<number>, holidays: Set<string>): boolean;
/**
 * Build a Set of JS getDay() indices from a Weekday array for fast lookup.
 */
export declare function workdaySet(workdays: Weekday[]): Set<number>;
/**
 * Add `days` working days to `startDate`, counting only days that are
 * in the workday set and not in holidays or PTO.
 *
 * If days === 0, returns startDate itself (or the next working day if startDate
 * is not a working day).
 *
 * The returned date is the last working day of the span.
 * Example: startDate=Monday, days=5, Mon-Fri schedule → returns Friday (same week).
 */
export declare function addWorkingDays(startDate: Date, days: number, workdays: Set<number>, holidays: Set<string>, pto?: Set<string>): Date;
/**
 * Subtract `days` working days from `endDate`, counting backwards only days
 * that are in the workday set and not in holidays or PTO.
 *
 * The returned date is the first working day of the span.
 * Example: endDate=Friday, days=5, Mon-Fri schedule → returns Monday (same week).
 */
export declare function subtractWorkingDays(endDate: Date, days: number, workdays: Set<number>, holidays: Set<string>, pto?: Set<string>): Date;
/**
 * Count working days between start (inclusive) and end (inclusive).
 */
export declare function workingDaysBetween(start: Date, end: Date, workdays: Set<number>, holidays: Set<string>): number;
/**
 * Advance past non-working days (weekends, holidays, PTO) to the next working day.
 * If the given date is already a working day, returns it unchanged.
 */
export declare function skipToWorkingDay(date: Date, workdays: Set<number>, holidays: Set<string>, pto?: Set<string>): Date;
