/**
 * JS Date.getDay() returns 0=Sunday, 1=Monday, ..., 6=Saturday.
 * Map our Weekday abbreviations to those indices.
 */
const WEEKDAY_TO_JS = {
    su: 0,
    m: 1,
    t: 2,
    w: 3,
    th: 4,
    f: 5,
    s: 6,
};
const JS_TO_WEEKDAY = ['su', 'm', 't', 'w', 'th', 'f', 's'];
/** Parse a weekday string to our Weekday type. Case-insensitive. */
export function parseWeekday(s) {
    const lower = s.toLowerCase().trim();
    if (lower in WEEKDAY_TO_JS)
        return lower;
    throw new Error(`Invalid weekday: "${s}". Expected one of: m, t, w, th, f, s, su`);
}
/** Parse a comma-separated workdays string like "m,t,w,th,f". */
export function parseWorkdays(s) {
    return s.split(',').map((d) => parseWeekday(d.trim()));
}
/** Get the JS Date.getDay() index for a weekday. */
export function weekdayIndex(d) {
    return WEEKDAY_TO_JS[d];
}
/** Get the Weekday abbreviation for a JS Date. */
export function dateToWeekday(date) {
    return JS_TO_WEEKDAY[date.getDay()];
}
/** Format a Date to ISO string "YYYY-MM-DD" in local time. */
export function toIsoDate(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}
/** Parse an ISO date string "YYYY-MM-DD" to a Date at midnight local time. */
export function fromIsoDate(iso) {
    const [y, m, d] = iso.split('-').map(Number);
    return new Date(y, m - 1, d);
}
/** Check if a date is a working day given a workdays set and holidays. */
export function isWorkingDay(date, workdays, holidays) {
    if (holidays.has(toIsoDate(date)))
        return false;
    return workdays.has(date.getDay());
}
/**
 * Build a Set of JS getDay() indices from a Weekday array for fast lookup.
 */
export function workdaySet(workdays) {
    return new Set(workdays.map(weekdayIndex));
}
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
export function addWorkingDays(startDate, days, workdays, holidays, pto) {
    let current = new Date(startDate);
    // First, advance to the next working day if start is non-working
    current = skipToWorkingDay(current, workdays, holidays, pto);
    if (days <= 0)
        return current;
    // Defensive: round up fractional days to preserve 1-based counting semantics
    days = Math.ceil(days);
    let counted = 0;
    while (counted < days - 1) {
        current.setDate(current.getDate() + 1);
        if (isDayWorking(current, workdays, holidays, pto)) {
            counted++;
        }
    }
    return current;
}
/**
 * Subtract `days` working days from `endDate`, counting backwards only days
 * that are in the workday set and not in holidays or PTO.
 *
 * The returned date is the first working day of the span.
 * Example: endDate=Friday, days=5, Mon-Fri schedule → returns Monday (same week).
 */
export function subtractWorkingDays(endDate, days, workdays, holidays, pto) {
    let current = new Date(endDate);
    if (days <= 0)
        return current;
    days = Math.ceil(days);
    let counted = 0;
    while (counted < days - 1) {
        current.setDate(current.getDate() - 1);
        if (isDayWorking(current, workdays, holidays, pto)) {
            counted++;
        }
    }
    return current;
}
/**
 * Count working days between start (inclusive) and end (inclusive).
 */
export function workingDaysBetween(start, end, workdays, holidays) {
    let count = 0;
    const current = new Date(start);
    while (current <= end) {
        if (isWorkingDay(current, workdays, holidays)) {
            count++;
        }
        current.setDate(current.getDate() + 1);
    }
    return count;
}
/**
 * Advance past non-working days (weekends, holidays, PTO) to the next working day.
 * If the given date is already a working day, returns it unchanged.
 */
export function skipToWorkingDay(date, workdays, holidays, pto) {
    const result = new Date(date);
    while (!isDayWorking(result, workdays, holidays, pto)) {
        result.setDate(result.getDate() + 1);
    }
    return result;
}
/** Internal: check if a day is working, considering workdays, holidays, and PTO. */
function isDayWorking(date, workdays, holidays, pto) {
    const iso = toIsoDate(date);
    if (holidays.has(iso))
        return false;
    if (pto && pto.has(iso))
        return false;
    return workdays.has(date.getDay());
}
//# sourceMappingURL=workday.js.map