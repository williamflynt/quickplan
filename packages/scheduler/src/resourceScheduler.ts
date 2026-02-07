import {
  CalendarConfig,
  ResourceCalendar,
  CpmResult,
  ResourceAssignment,
  ScheduledTask,
  ResourceScheduleRow,
  DEFAULT_WORKDAYS,
} from './types.js'
import {
  fromIsoDate,
  toIsoDate,
  workdaySet,
  addWorkingDays,
  subtractWorkingDays,
  skipToWorkingDay,
} from './workday.js'

/**
 * Schedule resources with calendar awareness.
 *
 * Takes CPM results (abstract offsets) and maps them to real calendar dates,
 * respecting per-resource workdays, holidays, and PTO.
 *
 * For each resource:
 * 1. Sort their tasks by CPM earliest start
 * 2. Track when the resource is next available (calendar date)
 * 3. Each task starts at the later of:
 *    (a) its CPM earliest start mapped to a calendar date
 *    (b) when the resource is next available
 * 4. Record both offset and date for each task
 */
export function scheduleResources(
  cpmResults: CpmResult[],
  assignments: ResourceAssignment[],
  config: CalendarConfig,
  resourceCalendars: ResourceCalendar[],
): ResourceScheduleRow[] {
  const calendarMap = new Map(
    resourceCalendars.map((rc) => [rc.resourceName, rc]),
  )

  // Build a lookup for CPM results by task ID
  const cpmMap = new Map(cpmResults.map((r) => [r.taskId, r]))

  // Group assignments by resource
  const tasksByResource = new Map<string, string[]>()
  for (const a of assignments) {
    if (!tasksByResource.has(a.resourceName)) {
      tasksByResource.set(a.resourceName, [])
    }
    tasksByResource.get(a.resourceName)!.push(a.taskId)
  }

  const rows: ResourceScheduleRow[] = []

  for (const [resourceName, taskIds] of tasksByResource) {
    const rc = calendarMap.get(resourceName)
    const resourceWorkdays =
      rc?.workdays ?? config.defaultWorkdays ?? DEFAULT_WORKDAYS
    const workdays = workdaySet(resourceWorkdays)
    const holidays = new Set(config.holidays)
    const pto = rc ? new Set(rc.pto) : new Set<string>()

    const projectStart = fromIsoDate(config.startDate)

    // Collect tasks with CPM data, sorted by earliest start
    const rawTasks = taskIds
      .map((taskId) => ({ taskId, cpm: cpmMap.get(taskId) }))
      .filter(
        (t): t is { taskId: string; cpm: CpmResult } => t.cpm !== undefined,
      )
      .sort((a, b) => a.cpm.earliestStart - b.cpm.earliestStart)

    const tasks: ScheduledTask[] = []
    let totalWorkingDays = 0
    let resourceAvailableDate = skipToWorkingDay(
      projectStart,
      workdays,
      holidays,
      pto,
    )

    for (const { taskId, cpm } of rawTasks) {
      let startIso: string
      let finishIso: string

      if (cpm.done && cpm.doneDate && cpm.startDate) {
        // Done with both explicit start and end dates: use them directly
        startIso = cpm.startDate
        finishIso = cpm.doneDate

        // Resource becomes available the day after doneDate
        const nextDay = fromIsoDate(cpm.doneDate)
        nextDay.setDate(nextDay.getDate() + 1)
        resourceAvailableDate = skipToWorkingDay(
          nextDay,
          workdays,
          holidays,
          pto,
        )
      } else if (cpm.done && cpm.doneDate) {
        // Done with explicit end date: use doneDate as finish,
        // compute start by subtracting planned duration backwards
        const doneDateObj = fromIsoDate(cpm.doneDate)
        finishIso = cpm.doneDate
        const roundedDuration = Math.round(cpm.duration)
        if (roundedDuration > 0) {
          // Subtract working days from finish to find start
          const computedStart = subtractWorkingDays(
            doneDateObj,
            roundedDuration,
            workdays,
            holidays,
            pto,
          )
          // Clamp: don't overlap with previous task for the same resource
          const clampedStart =
            computedStart >= resourceAvailableDate
              ? computedStart
              : resourceAvailableDate
          startIso = toIsoDate(clampedStart)
        } else {
          startIso = finishIso
        }

        // Resource becomes available the day after doneDate
        const nextDay = new Date(doneDateObj)
        nextDay.setDate(nextDay.getDate() + 1)
        resourceAvailableDate = skipToWorkingDay(
          nextDay,
          workdays,
          holidays,
          pto,
        )
      } else {
        // Normal scheduling: map CPM earliest start to calendar date
        const cpmStartDate = addWorkingDays(
          new Date(projectStart),
          cpm.earliestStart,
          workdays,
          holidays,
          pto,
        )

        // Task starts at the later of CPM start or resource availability
        const actualStartDate =
          cpmStartDate >= resourceAvailableDate
            ? cpmStartDate
            : resourceAvailableDate

        // Skip to next working day in case we landed on a non-working day
        const startDate = skipToWorkingDay(
          actualStartDate,
          workdays,
          holidays,
          pto,
        )

        // Calculate finish date: add duration working days from start
        // Round fractional PERT durations to nearest integer for day-granularity Gantt
        const roundedDuration = Math.round(cpm.duration)
        const finishDate =
          roundedDuration > 0
            ? addWorkingDays(
                new Date(startDate),
                roundedDuration,
                workdays,
                holidays,
                pto,
              )
            : new Date(startDate)

        // Resource becomes available the day after finish
        const nextDay = new Date(finishDate)
        nextDay.setDate(nextDay.getDate() + 1)
        resourceAvailableDate = skipToWorkingDay(
          nextDay,
          workdays,
          holidays,
          pto,
        )

        startIso = toIsoDate(startDate)
        finishIso = toIsoDate(finishDate)
      }

      tasks.push({
        taskId,
        taskName: taskId.replace(/^Task:/, ''),
        resourceName,
        startOffset: cpm.earliestStart,
        finishOffset: cpm.earliestStart + cpm.duration,
        startDate: startIso,
        finishDate: finishIso,
        duration: cpm.duration,
        isCritical: cpm.isCritical,
        done: cpm.done,
      })

      totalWorkingDays += cpm.duration
    }

    // Calendar span: total calendar days from first task start to last task finish
    let calendarSpan = 0
    if (tasks.length > 0) {
      const firstStart = fromIsoDate(tasks[0].startDate)
      const lastFinish = fromIsoDate(tasks[tasks.length - 1].finishDate)
      calendarSpan = Math.round(
        (lastFinish.getTime() - firstStart.getTime()) / (1000 * 60 * 60 * 24),
      )
    }

    rows.push({
      resourceName,
      tasks,
      totalWorkingDays,
      calendarSpan,
    })
  }

  // Sort by earliest task start date, then by name
  rows.sort((a, b) => {
    const aStart = a.tasks.length > 0 ? a.tasks[0].startDate : '\uffff'
    const bStart = b.tasks.length > 0 ? b.tasks[0].startDate : '\uffff'
    if (aStart !== bStart) return aStart < bStart ? -1 : 1
    return a.resourceName.localeCompare(b.resourceName)
  })

  return rows
}
