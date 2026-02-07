import { describe, it, expect } from 'vitest'
import { offsetToDate, dateToOffset, buildDateAxis } from '../src/dateMapper.js'
import { CalendarConfig, ResourceCalendar } from '../src/types.js'

const baseConfig: CalendarConfig = {
  startDate: '2026-03-02', // Monday
  defaultWorkdays: ['m', 't', 'w', 'th', 'f'],
  holidays: [],
}

describe('offsetToDate', () => {
  it('offset 0 = start date', () => {
    expect(offsetToDate(0, baseConfig)).toBe('2026-03-02')
  })

  it('offset 4 = Friday same week', () => {
    expect(offsetToDate(4, baseConfig)).toBe('2026-03-06')
  })

  it('offset 5 = Monday next week (skips weekend)', () => {
    expect(offsetToDate(5, baseConfig)).toBe('2026-03-09')
  })

  it('offset 9 = Friday of week 2', () => {
    expect(offsetToDate(9, baseConfig)).toBe('2026-03-13')
  })

  it('skips holiday', () => {
    const config: CalendarConfig = {
      ...baseConfig,
      holidays: ['2026-03-04'], // Wednesday
    }
    // offset 2 would normally be Wed, but it's a holiday → Thu
    expect(offsetToDate(2, config)).toBe('2026-03-05')
  })

  it('uses resource-specific workdays', () => {
    const rc: ResourceCalendar = {
      resourceName: 'Bob',
      workdays: ['t', 'w', 'th', 'f', 's'], // Tue-Sat
      pto: [],
    }
    // Start is Monday, but Bob doesn't work Monday → his first day is Tuesday
    expect(offsetToDate(0, baseConfig, rc)).toBe('2026-03-03')
    // 5 working days: Tue, Wed, Thu, Fri, Sat
    expect(offsetToDate(4, baseConfig, rc)).toBe('2026-03-07')
  })

  it('uses resource PTO', () => {
    const rc: ResourceCalendar = {
      resourceName: 'Alice',
      pto: ['2026-03-03', '2026-03-04'], // Tue, Wed
    }
    // offset 0 = Mon (start), offset 1 = skip Tue,Wed → Thu
    expect(offsetToDate(1, baseConfig, rc)).toBe('2026-03-05')
  })
})

describe('dateToOffset', () => {
  it('start date = offset 0', () => {
    expect(dateToOffset('2026-03-02', baseConfig)).toBe(0)
  })

  it('next working day = offset 1', () => {
    expect(dateToOffset('2026-03-03', baseConfig)).toBe(1)
  })

  it('Friday = offset 4', () => {
    expect(dateToOffset('2026-03-06', baseConfig)).toBe(4)
  })

  it('next Monday = offset 5 (weekend not counted)', () => {
    expect(dateToOffset('2026-03-09', baseConfig)).toBe(5)
  })

  it('date before start = 0', () => {
    expect(dateToOffset('2026-02-01', baseConfig)).toBe(0)
  })

  it('skips holiday in count', () => {
    const config: CalendarConfig = {
      ...baseConfig,
      holidays: ['2026-03-04'], // Wednesday
    }
    // Mon, Tue, [holiday Wed], Thu = 3 working days after start = offset 3
    // But dateToOffset counts working days from start(inclusive) to target(inclusive) - 1
    expect(dateToOffset('2026-03-05', config)).toBe(2)
  })
})

describe('buildDateAxis', () => {
  it('generates axis through end date', () => {
    // Mon Mar 2 through Mon Mar 9 (6 working days + weekend = 8 calendar days)
    const axis = buildDateAxis(baseConfig, '2026-03-09')

    expect(axis.length).toBe(8)

    // First entry is start date
    expect(axis[0]).toEqual({ date: '2026-03-02', offset: 0, type: 'working' })

    // Check weekend entries
    const saturday = axis.find((e) => e.date === '2026-03-07')
    expect(saturday).toEqual({
      date: '2026-03-07',
      offset: null,
      type: 'weekend',
    })

    const sunday = axis.find((e) => e.date === '2026-03-08')
    expect(sunday).toEqual({
      date: '2026-03-08',
      offset: null,
      type: 'weekend',
    })

    // Monday next week is offset 5
    const nextMon = axis.find((e) => e.date === '2026-03-09')
    expect(nextMon).toEqual({ date: '2026-03-09', offset: 5, type: 'working' })
  })

  it('marks holidays', () => {
    const config: CalendarConfig = {
      ...baseConfig,
      holidays: ['2026-03-04'],
    }
    const axis = buildDateAxis(config, '2026-03-09')
    const wed = axis.find((e) => e.date === '2026-03-04')
    expect(wed).toEqual({ date: '2026-03-04', offset: null, type: 'holiday' })
  })

  it('start date only produces single entry', () => {
    const axis = buildDateAxis(baseConfig, '2026-03-02')
    expect(axis.length).toBe(1)
    expect(axis[0]).toEqual({ date: '2026-03-02', offset: 0, type: 'working' })
  })
})
