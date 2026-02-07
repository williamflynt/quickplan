import { describe, it, expect } from 'vitest'
import {
  parseWeekday,
  parseWorkdays,
  weekdayIndex,
  dateToWeekday,
  toIsoDate,
  fromIsoDate,
  isWorkingDay,
  workdaySet,
  addWorkingDays,
  workingDaysBetween,
  skipToWorkingDay,
} from '../src/workday.js'
import { DEFAULT_WORKDAYS } from '../src/types.js'

describe('parseWeekday', () => {
  it.each([
    ['m', 'm'],
    ['t', 't'],
    ['w', 'w'],
    ['th', 'th'],
    ['f', 'f'],
    ['s', 's'],
    ['su', 'su'],
    ['M', 'm'],
    ['TH', 'th'],
    ['Su', 'su'],
    [' f ', 'f'],
  ] as const)('parses "%s" to "%s"', (input, expected) => {
    expect(parseWeekday(input)).toBe(expected)
  })

  it('throws on invalid input', () => {
    expect(() => parseWeekday('monday')).toThrow()
    expect(() => parseWeekday('x')).toThrow()
  })
})

describe('parseWorkdays', () => {
  it('parses comma-separated weekday string', () => {
    expect(parseWorkdays('m,t,w,th,f')).toEqual(['m', 't', 'w', 'th', 'f'])
  })

  it('handles spaces', () => {
    expect(parseWorkdays('t, w, th, f, s')).toEqual(['t', 'w', 'th', 'f', 's'])
  })
})

describe('weekdayIndex', () => {
  it.each([
    ['su', 0],
    ['m', 1],
    ['t', 2],
    ['w', 3],
    ['th', 4],
    ['f', 5],
    ['s', 6],
  ] as const)('%s → %d', (day, expected) => {
    expect(weekdayIndex(day)).toBe(expected)
  })
})

describe('dateToWeekday', () => {
  it('returns correct weekday for known dates', () => {
    // 2026-03-02 is a Monday
    expect(dateToWeekday(new Date(2026, 2, 2))).toBe('m')
    // 2026-03-07 is a Saturday
    expect(dateToWeekday(new Date(2026, 2, 7))).toBe('s')
    // 2026-03-08 is a Sunday
    expect(dateToWeekday(new Date(2026, 2, 8))).toBe('su')
  })
})

describe('toIsoDate / fromIsoDate', () => {
  it('round-trips correctly', () => {
    const date = new Date(2026, 2, 15) // March 15, 2026
    const iso = toIsoDate(date)
    expect(iso).toBe('2026-03-15')
    const back = fromIsoDate(iso)
    expect(back.getFullYear()).toBe(2026)
    expect(back.getMonth()).toBe(2)
    expect(back.getDate()).toBe(15)
  })

  it('pads single-digit months and days', () => {
    expect(toIsoDate(new Date(2026, 0, 5))).toBe('2026-01-05')
  })
})

describe('isWorkingDay', () => {
  const mfSet = workdaySet(DEFAULT_WORKDAYS) // Mon-Fri

  it('Monday is a working day', () => {
    expect(isWorkingDay(new Date(2026, 2, 2), mfSet, new Set())).toBe(true)
  })

  it('Saturday is not a working day for Mon-Fri', () => {
    expect(isWorkingDay(new Date(2026, 2, 7), mfSet, new Set())).toBe(false)
  })

  it('Sunday is not a working day for Mon-Fri', () => {
    expect(isWorkingDay(new Date(2026, 2, 8), mfSet, new Set())).toBe(false)
  })

  it('holiday overrides a working day', () => {
    const holidays = new Set(['2026-03-02']) // Monday
    expect(isWorkingDay(new Date(2026, 2, 2), mfSet, holidays)).toBe(false)
  })

  it('Tue-Sat workweek: Saturday is working, Sunday/Monday are not', () => {
    const tuesat = workdaySet(['t', 'w', 'th', 'f', 's'])
    expect(isWorkingDay(new Date(2026, 2, 7), tuesat, new Set())).toBe(true) // Sat
    expect(isWorkingDay(new Date(2026, 2, 8), tuesat, new Set())).toBe(false) // Sun
    expect(isWorkingDay(new Date(2026, 2, 9), tuesat, new Set())).toBe(false) // Mon
  })
})

describe('addWorkingDays', () => {
  const mf = workdaySet(DEFAULT_WORKDAYS)
  const noHolidays = new Set<string>()

  it('0 working days returns start date itself', () => {
    const start = new Date(2026, 2, 2) // Monday
    const result = addWorkingDays(start, 0, mf, noHolidays)
    expect(toIsoDate(result)).toBe('2026-03-02')
  })

  it('1 working day from Monday = Monday', () => {
    const start = new Date(2026, 2, 2) // Monday
    const result = addWorkingDays(start, 1, mf, noHolidays)
    expect(toIsoDate(result)).toBe('2026-03-02')
  })

  it('5 working days from Monday = Friday same week', () => {
    const start = new Date(2026, 2, 2) // Monday
    const result = addWorkingDays(start, 5, mf, noHolidays)
    expect(toIsoDate(result)).toBe('2026-03-06')
  })

  it('6 working days from Monday skips weekend to next Monday', () => {
    const start = new Date(2026, 2, 2) // Monday
    const result = addWorkingDays(start, 6, mf, noHolidays)
    expect(toIsoDate(result)).toBe('2026-03-09')
  })

  it('10 working days = 2 full weeks', () => {
    const start = new Date(2026, 2, 2) // Monday
    const result = addWorkingDays(start, 10, mf, noHolidays)
    expect(toIsoDate(result)).toBe('2026-03-13') // Friday of week 2
  })

  it('skips holiday in the middle', () => {
    const holidays = new Set(['2026-03-04']) // Wednesday
    const start = new Date(2026, 2, 2) // Monday
    const result = addWorkingDays(start, 5, mf, holidays)
    // Mon, Tue, [skip Wed], Thu, Fri, Mon → 5 working days lands on Monday
    expect(toIsoDate(result)).toBe('2026-03-09')
  })

  it('skips PTO days', () => {
    const pto = new Set(['2026-03-03', '2026-03-04']) // Tue, Wed
    const start = new Date(2026, 2, 2) // Monday
    const result = addWorkingDays(start, 5, mf, noHolidays, pto)
    // Mon, [skip Tue, Wed], Thu, Fri, Mon, Tue → 5 working days
    expect(toIsoDate(result)).toBe('2026-03-10')
  })

  it('starting on Saturday advances to Monday first', () => {
    const start = new Date(2026, 2, 7) // Saturday
    const result = addWorkingDays(start, 1, mf, noHolidays)
    expect(toIsoDate(result)).toBe('2026-03-09') // Monday
  })

  it('Tue-Sat schedule: 5 days from Tuesday = Saturday', () => {
    const tuesat = workdaySet(['t', 'w', 'th', 'f', 's'])
    const start = new Date(2026, 2, 3) // Tuesday
    const result = addWorkingDays(start, 5, tuesat, noHolidays)
    expect(toIsoDate(result)).toBe('2026-03-07') // Saturday
  })

  it('Tue-Sat schedule: 6 days from Tuesday skips Sun+Mon', () => {
    const tuesat = workdaySet(['t', 'w', 'th', 'f', 's'])
    const start = new Date(2026, 2, 3) // Tuesday
    const result = addWorkingDays(start, 6, tuesat, noHolidays)
    expect(toIsoDate(result)).toBe('2026-03-10') // next Tuesday
  })

  it('fractional days are ceiled: 5.2 from Monday = 6 working days', () => {
    const start = new Date(2026, 2, 2) // Monday
    const result = addWorkingDays(start, 5.2, mf, noHolidays)
    // ceil(5.2) = 6 → Mon, Tue, Wed, Thu, Fri, Mon = next Monday
    expect(toIsoDate(result)).toBe('2026-03-09')
  })

  it('fractional days: 2.8 from Monday = 3 working days', () => {
    const start = new Date(2026, 2, 2) // Monday
    const result = addWorkingDays(start, 2.8, mf, noHolidays)
    // ceil(2.8) = 3 → Mon, Tue, Wed
    expect(toIsoDate(result)).toBe('2026-03-04')
  })
})

describe('workingDaysBetween', () => {
  const mf = workdaySet(DEFAULT_WORKDAYS)
  const noHolidays = new Set<string>()

  it('Mon to Fri = 5 working days', () => {
    const start = new Date(2026, 2, 2)
    const end = new Date(2026, 2, 6)
    expect(workingDaysBetween(start, end, mf, noHolidays)).toBe(5)
  })

  it('Mon to next Mon = 6 working days', () => {
    const start = new Date(2026, 2, 2)
    const end = new Date(2026, 2, 9)
    expect(workingDaysBetween(start, end, mf, noHolidays)).toBe(6)
  })

  it('same day = 1 if working', () => {
    const d = new Date(2026, 2, 2)
    expect(workingDaysBetween(d, d, mf, noHolidays)).toBe(1)
  })

  it('same day = 0 if weekend', () => {
    const d = new Date(2026, 2, 7) // Saturday
    expect(workingDaysBetween(d, d, mf, noHolidays)).toBe(0)
  })

  it('excludes holidays', () => {
    const holidays = new Set(['2026-03-04']) // Wed
    const start = new Date(2026, 2, 2)
    const end = new Date(2026, 2, 6)
    expect(workingDaysBetween(start, end, mf, holidays)).toBe(4)
  })
})

describe('skipToWorkingDay', () => {
  const mf = workdaySet(DEFAULT_WORKDAYS)
  const noHolidays = new Set<string>()

  it('returns same day if already working', () => {
    const d = new Date(2026, 2, 2) // Monday
    expect(toIsoDate(skipToWorkingDay(d, mf, noHolidays))).toBe('2026-03-02')
  })

  it('advances Saturday to Monday', () => {
    const d = new Date(2026, 2, 7)
    expect(toIsoDate(skipToWorkingDay(d, mf, noHolidays))).toBe('2026-03-09')
  })

  it('advances Sunday to Monday', () => {
    const d = new Date(2026, 2, 8)
    expect(toIsoDate(skipToWorkingDay(d, mf, noHolidays))).toBe('2026-03-09')
  })

  it('advances past holiday', () => {
    const holidays = new Set(['2026-03-09']) // Monday is a holiday
    const d = new Date(2026, 2, 7) // Saturday
    expect(toIsoDate(skipToWorkingDay(d, mf, holidays))).toBe('2026-03-10')
  })

  it('advances past PTO', () => {
    const pto = new Set(['2026-03-09']) // Monday PTO
    const d = new Date(2026, 2, 7) // Saturday
    expect(toIsoDate(skipToWorkingDay(d, mf, noHolidays, pto))).toBe(
      '2026-03-10',
    )
  })
})
