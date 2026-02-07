/**
 * Short weekday abbreviations matching user DSL input.
 * m=Monday, t=Tuesday, w=Wednesday, th=Thursday, f=Friday, s=Saturday, su=Sunday
 */
export type Weekday = 'm' | 't' | 'w' | 'th' | 'f' | 's' | 'su'

export const ALL_WEEKDAYS: Weekday[] = ['m', 't', 'w', 'th', 'f', 's', 'su']

export const DEFAULT_WORKDAYS: Weekday[] = ['m', 't', 'w', 'th', 'f']

export type CalendarConfig = {
  startDate: string // ISO date: "2026-03-01"
  defaultWorkdays: Weekday[] // e.g. ['m','t','w','th','f']
  holidays: string[] // ISO dates: ["2026-12-25"]
}

export type ResourceCalendar = {
  resourceName: string
  workdays?: Weekday[] // Override project default
  pto: string[] // ISO dates this person is off
}

export type DateRange = { start: string; end: string } // ISO dates, inclusive

export type ScheduledDate = {
  offset: number // Abstract working-day offset (from CPM)
  date: string // Resolved ISO calendar date
}

export type DateAxisEntry = {
  date: string // ISO date
  offset: number | null // Working-day offset (null for non-working days)
  type: 'working' | 'weekend' | 'holiday'
}

export type CpmResult = {
  taskId: string
  earliestStart: number // Abstract offset
  duration: number // Working days
  isCritical: boolean
  done: boolean
  doneDate?: string // ISO date: task completed on this date
  startDate?: string // ISO date: task started on this date
}

export type ResourceAssignment = {
  resourceName: string
  taskId: string
}

export type ScheduledTask = {
  taskId: string
  taskName: string
  resourceName: string
  startOffset: number // Working-day offset
  finishOffset: number
  startDate: string // ISO calendar date
  finishDate: string
  duration: number
  isCritical: boolean
  done: boolean
}

export type ResourceScheduleRow = {
  resourceName: string
  tasks: ScheduledTask[]
  totalWorkingDays: number
  calendarSpan: number // Total calendar days from first start to last finish
}
