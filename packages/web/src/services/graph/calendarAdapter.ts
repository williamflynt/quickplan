import {
  CalendarConfig,
  ResourceCalendar,
  DateAxisEntry,
  ResourceScheduleRow,
  parseWorkdays,
  DEFAULT_WORKDAYS,
  scheduleResources,
  buildDateAxis,
  dateToOffset,
  offsetToDate,
} from '@quickplan/scheduler'
import type {
  CalendarConfigRaw,
  Project,
  CpmTaskResult,
} from '../../types/graph'

/**
 * Parse a raw CalendarConfigRaw (from DSL attributes) into a CalendarConfig
 * that the scheduler can use.
 */
export function parseCalendarConfig(raw: CalendarConfigRaw): CalendarConfig {
  return {
    startDate: raw.startDate,
    defaultWorkdays: raw.workdays
      ? parseWorkdays(raw.workdays)
      : DEFAULT_WORKDAYS,
    holidays: raw.holidays
      ? raw.holidays
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
      : [],
  }
}

/**
 * Build ResourceCalendar[] from project resource attributes.
 * Resources may have `workdays` and `pto` attributes.
 */
export function buildResourceCalendars(project: Project): ResourceCalendar[] {
  const calendars: ResourceCalendar[] = []

  for (const [name, resource] of Object.entries(project.resources)) {
    const attrs = (resource as Record<string, unknown>).attributes as
      | Record<string, string | number>
      | undefined
    if (!attrs) continue

    const workdays =
      typeof attrs.workdays === 'string'
        ? parseWorkdays(attrs.workdays)
        : undefined

    const ptoStr = typeof attrs.pto === 'string' ? attrs.pto : undefined
    const pto = ptoStr ? parsePtoDates(ptoStr) : []

    if (workdays || pto.length > 0) {
      calendars.push({ resourceName: name, workdays, pto })
    }
  }

  return calendars
}

/**
 * Parse PTO string which can be:
 * - Comma-separated dates: "2026-03-10,2026-03-11"
 * - Date ranges with "..": "2026-04-01..2026-04-05"
 * - Mix of both: "2026-03-10,2026-04-01..2026-04-05"
 */
function parsePtoDates(pto: string): string[] {
  const dates: string[] = []
  for (const part of pto.split(',')) {
    const trimmed = part.trim()
    if (!trimmed) continue

    if (trimmed.includes('..')) {
      const [start, end] = trimmed.split('..')
      const startDate = new Date(start.trim())
      const endDate = new Date(end.trim())
      const current = new Date(startDate)
      while (current <= endDate) {
        const y = current.getFullYear()
        const m = String(current.getMonth() + 1).padStart(2, '0')
        const d = String(current.getDate()).padStart(2, '0')
        dates.push(`${y}-${m}-${d}`)
        current.setDate(current.getDate() + 1)
      }
    } else {
      dates.push(trimmed)
    }
  }
  return dates
}

/**
 * Apply date constraints from task `after` attributes.
 * Returns a map of taskId → minimum earliestStart offset.
 */
export function getDateConstraints(
  project: Project,
  config: CalendarConfig,
): Map<string, number> {
  const constraints = new Map<string, number>()

  for (const [name, task] of Object.entries(project.tasks)) {
    const attrs = (task as Record<string, unknown>).attributes as
      | Record<string, string | number>
      | undefined
    if (!attrs) continue

    if (typeof attrs.after === 'string') {
      const offset = dateToOffset(attrs.after, config)
      constraints.set(`Task:${name}`, offset)
    }
  }

  return constraints
}

/**
 * Run calendar-aware scheduling after CPM completes.
 */
export function runCalendarScheduling(
  cpmResults: Record<string, CpmTaskResult>,
  project: Project,
  config: CalendarConfig,
  resourceCalendars: ResourceCalendar[],
): { scheduledRows: ResourceScheduleRow[]; dateAxis: DateAxisEntry[] } {
  // Build CpmResult[] for the scheduler.
  // cpmResults now carries planning-run values, so plannedDuration reflects
  // the full planned schedule for all tasks (including done ones).
  const cpmForScheduler = Object.entries(cpmResults).map(([taskId, cpm]) => ({
    taskId,
    earliestStart: cpm.earliestStart,
    duration: cpm.plannedDuration,
    isCritical: cpm.isCritical,
    done: cpm.done === true,
    doneDate: cpm.doneDate,
    startDate: cpm.startDate,
  }))

  // Build assignments from project
  const assignments = project.assignments
    .filter((a) => a.source.type === 'Resource')
    .map((a) => ({
      resourceName: a.source.name,
      taskId: `${a.target.type}:${a.target.name}`,
    }))

  // Run calendar-aware scheduling
  const scheduledRows = scheduleResources(
    cpmForScheduler,
    assignments,
    config,
    resourceCalendars,
  )

  // Find the latest date across CPM offsets and resource-leveled tasks.
  // Use actual dates to avoid double-converting through offsets.
  let maxDate = config.startDate
  for (const r of Object.values(cpmResults)) {
    const d = offsetToDate(Math.ceil(r.earliestFinish), config)
    if (d > maxDate) maxDate = d
  }
  for (const row of scheduledRows) {
    for (const t of row.tasks) {
      if (t.finishDate > maxDate) maxDate = t.finishDate
    }
  }

  const dateAxis = buildDateAxis(config, maxDate)

  return { scheduledRows, dateAxis }
}
