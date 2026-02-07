import { DEFAULT_WORKDAYS, } from './types.js';
import { fromIsoDate, toIsoDate, workdaySet, addWorkingDays, workingDaysBetween, isWorkingDay, } from './workday.js';
/**
 * Convert an abstract working-day offset to an ISO calendar date.
 *
 * Offset 0 = project start date (which must be a working day for the resource).
 * Offset N = the Nth working day after start.
 *
 * If a resourceCalendar is provided, uses their workdays + PTO.
 * Otherwise uses the project default workdays.
 */
export function offsetToDate(offset, config, resourceCalendar) {
    const start = fromIsoDate(config.startDate);
    const workdays = workdaySet(resourceCalendar?.workdays ?? config.defaultWorkdays ?? DEFAULT_WORKDAYS);
    const holidays = new Set(config.holidays);
    const pto = resourceCalendar ? new Set(resourceCalendar.pto) : undefined;
    // offset 0 → start date (or next working day for this resource)
    // offset N → (N+1)th working day from start
    const result = addWorkingDays(start, offset + 1, workdays, holidays, pto);
    return toIsoDate(result);
}
/**
 * Convert an ISO calendar date to a working-day offset from the project start.
 * Uses project default workdays (no resource-specific calendar).
 */
export function dateToOffset(date, config) {
    const start = fromIsoDate(config.startDate);
    const target = fromIsoDate(date);
    const workdays = workdaySet(config.defaultWorkdays ?? DEFAULT_WORKDAYS);
    const holidays = new Set(config.holidays);
    if (target < start)
        return 0;
    // Count working days from start (exclusive) to target (inclusive).
    // Offset 0 = start date itself, offset 1 = next working day, etc.
    const count = workingDaysBetween(start, target, workdays, holidays);
    // Subtract 1 because start date itself is offset 0
    return count - 1;
}
/**
 * Build the full calendar date axis for Gantt rendering.
 *
 * Generates one entry per calendar day from project start through `endDate`,
 * marking each as working / weekend / holiday.
 */
export function buildDateAxis(config, endDate) {
    const start = fromIsoDate(config.startDate);
    const end = fromIsoDate(endDate);
    const workdays = workdaySet(config.defaultWorkdays ?? DEFAULT_WORKDAYS);
    const holidays = new Set(config.holidays);
    const entries = [];
    const current = new Date(start);
    let workingDayIndex = 0;
    while (current <= end) {
        const iso = toIsoDate(current);
        const isHoliday = holidays.has(iso);
        const isWork = isWorkingDay(current, workdays, holidays);
        let type;
        if (isHoliday) {
            type = 'holiday';
        }
        else if (!isWork) {
            type = 'weekend';
        }
        else {
            type = 'working';
        }
        entries.push({
            date: iso,
            offset: isWork ? workingDayIndex : null,
            type,
        });
        if (isWork)
            workingDayIndex++;
        current.setDate(current.getDate() + 1);
    }
    return entries;
}
//# sourceMappingURL=dateMapper.js.map