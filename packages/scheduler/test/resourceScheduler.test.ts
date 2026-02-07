import { describe, it, expect } from 'vitest'
import { scheduleResources } from '../src/resourceScheduler.js'
import {
  CalendarConfig,
  ResourceCalendar,
  CpmResult,
  ResourceAssignment,
} from '../src/types.js'

const baseConfig: CalendarConfig = {
  startDate: '2026-03-02', // Monday
  defaultWorkdays: ['m', 't', 'w', 'th', 'f'],
  holidays: [],
}

describe('scheduleResources', () => {
  it('schedules a single resource with two sequential tasks', () => {
    const cpmResults: CpmResult[] = [
      {
        taskId: 'Task:Design',
        earliestStart: 0,
        duration: 3,
        isCritical: true,
        done: false,
      },
      {
        taskId: 'Task:Build',
        earliestStart: 3,
        duration: 5,
        isCritical: true,
        done: false,
      },
    ]
    const assignments: ResourceAssignment[] = [
      { resourceName: 'Alice', taskId: 'Task:Design' },
      { resourceName: 'Alice', taskId: 'Task:Build' },
    ]

    const rows = scheduleResources(cpmResults, assignments, baseConfig, [])

    expect(rows).toHaveLength(1)
    const alice = rows[0]
    expect(alice.resourceName).toBe('Alice')
    expect(alice.tasks).toHaveLength(2)

    // Design: 3 working days from Mon = Mon, Tue, Wed
    expect(alice.tasks[0].startDate).toBe('2026-03-02')
    expect(alice.tasks[0].finishDate).toBe('2026-03-04')

    // Build: 5 working days starting Thu = Thu, Fri, Mon, Tue, Wed
    expect(alice.tasks[1].startDate).toBe('2026-03-05')
    expect(alice.tasks[1].finishDate).toBe('2026-03-11')
  })

  it('task starts after CPM earliest if resource is busy', () => {
    const cpmResults: CpmResult[] = [
      {
        taskId: 'Task:A',
        earliestStart: 0,
        duration: 5,
        isCritical: false,
        done: false,
      },
      {
        taskId: 'Task:B',
        earliestStart: 0,
        duration: 3,
        isCritical: false,
        done: false,
      },
    ]
    const assignments: ResourceAssignment[] = [
      { resourceName: 'Alice', taskId: 'Task:A' },
      { resourceName: 'Alice', taskId: 'Task:B' },
    ]

    const rows = scheduleResources(cpmResults, assignments, baseConfig, [])
    const alice = rows[0]

    // A: Mon-Fri (5 days)
    expect(alice.tasks[0].startDate).toBe('2026-03-02')
    expect(alice.tasks[0].finishDate).toBe('2026-03-06')

    // B: would start at offset 0, but Alice is busy until Friday
    // So B starts next Monday
    expect(alice.tasks[1].startDate).toBe('2026-03-09')
    expect(alice.tasks[1].finishDate).toBe('2026-03-11')
  })

  it('respects per-resource Tue-Sat workdays', () => {
    const cpmResults: CpmResult[] = [
      {
        taskId: 'Task:Test',
        earliestStart: 0,
        duration: 5,
        isCritical: false,
        done: false,
      },
    ]
    const assignments: ResourceAssignment[] = [
      { resourceName: 'Bob', taskId: 'Task:Test' },
    ]
    const calendars: ResourceCalendar[] = [
      { resourceName: 'Bob', workdays: ['t', 'w', 'th', 'f', 's'], pto: [] },
    ]

    const rows = scheduleResources(
      cpmResults,
      assignments,
      baseConfig,
      calendars,
    )
    const bob = rows[0]

    // Bob doesn't work Monday. His first working day is Tuesday.
    // 5 days: Tue, Wed, Thu, Fri, Sat
    expect(bob.tasks[0].startDate).toBe('2026-03-03')
    expect(bob.tasks[0].finishDate).toBe('2026-03-07')
  })

  it('skips PTO days for resource', () => {
    const cpmResults: CpmResult[] = [
      {
        taskId: 'Task:Work',
        earliestStart: 0,
        duration: 5,
        isCritical: false,
        done: false,
      },
    ]
    const assignments: ResourceAssignment[] = [
      { resourceName: 'Alice', taskId: 'Task:Work' },
    ]
    const calendars: ResourceCalendar[] = [
      {
        resourceName: 'Alice',
        pto: ['2026-03-04', '2026-03-05'], // Wed, Thu
      },
    ]

    const rows = scheduleResources(
      cpmResults,
      assignments,
      baseConfig,
      calendars,
    )
    const alice = rows[0]

    // Mon, Tue, [skip Wed, Thu], Fri, Mon, Tue = 5 working days
    expect(alice.tasks[0].startDate).toBe('2026-03-02')
    expect(alice.tasks[0].finishDate).toBe('2026-03-10')
  })

  it('skips holidays for all resources', () => {
    const config: CalendarConfig = {
      ...baseConfig,
      holidays: ['2026-03-04'], // Wednesday
    }
    const cpmResults: CpmResult[] = [
      {
        taskId: 'Task:Work',
        earliestStart: 0,
        duration: 5,
        isCritical: false,
        done: false,
      },
    ]
    const assignments: ResourceAssignment[] = [
      { resourceName: 'Alice', taskId: 'Task:Work' },
    ]

    const rows = scheduleResources(cpmResults, assignments, config, [])
    const alice = rows[0]

    // Mon, Tue, [holiday Wed], Thu, Fri, Mon = 5 working days
    expect(alice.tasks[0].startDate).toBe('2026-03-02')
    expect(alice.tasks[0].finishDate).toBe('2026-03-09')
  })

  it('handles done tasks', () => {
    const cpmResults: CpmResult[] = [
      {
        taskId: 'Task:Done',
        earliestStart: 0,
        duration: 3,
        isCritical: false,
        done: true,
      },
      {
        taskId: 'Task:Next',
        earliestStart: 3,
        duration: 2,
        isCritical: false,
        done: false,
      },
    ]
    const assignments: ResourceAssignment[] = [
      { resourceName: 'Alice', taskId: 'Task:Done' },
      { resourceName: 'Alice', taskId: 'Task:Next' },
    ]

    const rows = scheduleResources(cpmResults, assignments, baseConfig, [])
    expect(rows[0].tasks[0].done).toBe(true)
    expect(rows[0].tasks[1].done).toBe(false)
  })

  it('multiple resources scheduled independently', () => {
    const cpmResults: CpmResult[] = [
      {
        taskId: 'Task:A',
        earliestStart: 0,
        duration: 5,
        isCritical: true,
        done: false,
      },
      {
        taskId: 'Task:B',
        earliestStart: 0,
        duration: 3,
        isCritical: false,
        done: false,
      },
    ]
    const assignments: ResourceAssignment[] = [
      { resourceName: 'Alice', taskId: 'Task:A' },
      { resourceName: 'Bob', taskId: 'Task:B' },
    ]

    const rows = scheduleResources(cpmResults, assignments, baseConfig, [])
    expect(rows).toHaveLength(2)

    // Both start on the same day since they're different resources
    const alice = rows.find((r) => r.resourceName === 'Alice')!
    const bob = rows.find((r) => r.resourceName === 'Bob')!

    expect(alice.tasks[0].startDate).toBe('2026-03-02')
    expect(bob.tasks[0].startDate).toBe('2026-03-02')
  })

  it('zero-duration task (milestone) stays on one date', () => {
    const cpmResults: CpmResult[] = [
      {
        taskId: 'Task:Launch',
        earliestStart: 5,
        duration: 0,
        isCritical: true,
        done: false,
      },
    ]
    const assignments: ResourceAssignment[] = [
      { resourceName: 'Alice', taskId: 'Task:Launch' },
    ]

    const rows = scheduleResources(cpmResults, assignments, baseConfig, [])
    expect(rows[0].tasks[0].startDate).toBe(rows[0].tasks[0].finishDate)
  })

  it('calculates totalWorkingDays and calendarSpan', () => {
    const cpmResults: CpmResult[] = [
      {
        taskId: 'Task:A',
        earliestStart: 0,
        duration: 5,
        isCritical: false,
        done: false,
      },
      {
        taskId: 'Task:B',
        earliestStart: 5,
        duration: 3,
        isCritical: false,
        done: false,
      },
    ]
    const assignments: ResourceAssignment[] = [
      { resourceName: 'Alice', taskId: 'Task:A' },
      { resourceName: 'Alice', taskId: 'Task:B' },
    ]

    const rows = scheduleResources(cpmResults, assignments, baseConfig, [])
    expect(rows[0].totalWorkingDays).toBe(8)
    // Mon Mar 2 to Wed Mar 11 = 9 calendar days
    expect(rows[0].calendarSpan).toBe(9)
  })

  it('rounds fractional PERT duration for finish date', () => {
    const cpmResults: CpmResult[] = [
      {
        taskId: 'Task:Arch',
        earliestStart: 0,
        duration: 5.17, // PERT: (3 + 4*5 + 8) / 6
        isCritical: true,
        done: false,
      },
    ]
    const assignments: ResourceAssignment[] = [
      { resourceName: 'Alice', taskId: 'Task:Arch' },
    ]

    const rows = scheduleResources(cpmResults, assignments, baseConfig, [])
    const alice = rows[0]

    // round(5.17) = 5 → Mon, Tue, Wed, Thu, Fri
    expect(alice.tasks[0].startDate).toBe('2026-03-02')
    expect(alice.tasks[0].finishDate).toBe('2026-03-06')
  })

  it('rounds fractional PERT duration up when >= .5', () => {
    const cpmResults: CpmResult[] = [
      {
        taskId: 'Task:Work',
        earliestStart: 0,
        duration: 5.8,
        isCritical: false,
        done: false,
      },
    ]
    const assignments: ResourceAssignment[] = [
      { resourceName: 'Alice', taskId: 'Task:Work' },
    ]

    const rows = scheduleResources(cpmResults, assignments, baseConfig, [])
    const alice = rows[0]

    // round(5.8) = 6 → Mon-Fri + next Mon
    expect(alice.tasks[0].startDate).toBe('2026-03-02')
    expect(alice.tasks[0].finishDate).toBe('2026-03-09')
  })

  it('done+doneDate places task at doneDate and computes start backwards', () => {
    // Task with 3 working days duration, done on Wed Mar 4
    // Start should be Mon Mar 2 (3 working days: Mon, Tue, Wed)
    const cpmResults: CpmResult[] = [
      {
        taskId: 'Task:Design',
        earliestStart: 0,
        duration: 3,
        isCritical: false,
        done: true,
        doneDate: '2026-03-04', // Wednesday
      },
    ]
    const assignments: ResourceAssignment[] = [
      { resourceName: 'Alice', taskId: 'Task:Design' },
    ]

    const rows = scheduleResources(cpmResults, assignments, baseConfig, [])
    const task = rows[0].tasks[0]
    expect(task.startDate).toBe('2026-03-02')
    expect(task.finishDate).toBe('2026-03-04')
    expect(task.done).toBe(true)
  })

  it('done+doneDate frees resource after doneDate for subsequent tasks', () => {
    // Design: done on Wed Mar 4 (duration 3)
    // Build: should start Thu Mar 5 (resource freed after doneDate)
    const cpmResults: CpmResult[] = [
      {
        taskId: 'Task:Design',
        earliestStart: 0,
        duration: 3,
        isCritical: false,
        done: true,
        doneDate: '2026-03-04',
      },
      {
        taskId: 'Task:Build',
        earliestStart: 3,
        duration: 2,
        isCritical: false,
        done: false,
      },
    ]
    const assignments: ResourceAssignment[] = [
      { resourceName: 'Alice', taskId: 'Task:Design' },
      { resourceName: 'Alice', taskId: 'Task:Build' },
    ]

    const rows = scheduleResources(cpmResults, assignments, baseConfig, [])
    const alice = rows[0]
    expect(alice.tasks[0].finishDate).toBe('2026-03-04')
    // Build starts Thu Mar 5, finishes Fri Mar 6
    expect(alice.tasks[1].startDate).toBe('2026-03-05')
    expect(alice.tasks[1].finishDate).toBe('2026-03-06')
  })

  it('done without doneDate preserves existing zero-duration behavior', () => {
    const cpmResults: CpmResult[] = [
      {
        taskId: 'Task:Done',
        earliestStart: 0,
        duration: 3,
        isCritical: false,
        done: true,
      },
      {
        taskId: 'Task:Next',
        earliestStart: 3,
        duration: 2,
        isCritical: false,
        done: false,
      },
    ]
    const assignments: ResourceAssignment[] = [
      { resourceName: 'Alice', taskId: 'Task:Done' },
      { resourceName: 'Alice', taskId: 'Task:Next' },
    ]

    const rows = scheduleResources(cpmResults, assignments, baseConfig, [])
    expect(rows[0].tasks[0].done).toBe(true)
    // Without doneDate, normal scheduling applies
    expect(rows[0].tasks[0].startDate).toBe('2026-03-02')
    expect(rows[0].tasks[0].finishDate).toBe('2026-03-04')
  })

  it('done+doneDate with zero duration collapses to single date', () => {
    const cpmResults: CpmResult[] = [
      {
        taskId: 'Task:Kickoff',
        earliestStart: 0,
        duration: 0,
        isCritical: false,
        done: true,
        doneDate: '2026-03-03',
      },
    ]
    const assignments: ResourceAssignment[] = [
      { resourceName: 'Alice', taskId: 'Task:Kickoff' },
    ]

    const rows = scheduleResources(cpmResults, assignments, baseConfig, [])
    const task = rows[0].tasks[0]
    expect(task.startDate).toBe('2026-03-03')
    expect(task.finishDate).toBe('2026-03-03')
  })

  it('done+startDate+doneDate uses exact dates', () => {
    const cpmResults: CpmResult[] = [
      {
        taskId: 'Task:Design',
        earliestStart: 0,
        duration: 5,
        isCritical: false,
        done: true,
        startDate: '2026-03-02', // Monday
        doneDate: '2026-03-05', // Thursday — actual duration shorter than estimated
      },
    ]
    const assignments: ResourceAssignment[] = [
      { resourceName: 'Alice', taskId: 'Task:Design' },
    ]

    const rows = scheduleResources(cpmResults, assignments, baseConfig, [])
    const task = rows[0].tasks[0]
    expect(task.startDate).toBe('2026-03-02')
    expect(task.finishDate).toBe('2026-03-05')
  })

  it('two done tasks for same resource do not overlap', () => {
    // First task: done on Wed Mar 4 (duration 5, computed start would be Thu Feb 26)
    // Second task: done on Fri Mar 6 (duration 3, computed start would be Wed Mar 4)
    // Without clamping, first task overlaps into before project start
    // With clamping, first task start is clamped to resource availability
    const cpmResults: CpmResult[] = [
      {
        taskId: 'Task:Alpha',
        earliestStart: 0,
        duration: 5,
        isCritical: false,
        done: true,
        doneDate: '2026-03-04', // Wednesday
      },
      {
        taskId: 'Task:Beta',
        earliestStart: 0,
        duration: 3,
        isCritical: false,
        done: true,
        doneDate: '2026-03-06', // Friday
      },
    ]
    const assignments: ResourceAssignment[] = [
      { resourceName: 'Alice', taskId: 'Task:Alpha' },
      { resourceName: 'Alice', taskId: 'Task:Beta' },
    ]

    const rows = scheduleResources(cpmResults, assignments, baseConfig, [])
    const alice = rows[0]
    // Alpha finishes Wed. Beta's computed start (subtract 3 from Fri) = Wed.
    // But resource is only free Thu after Alpha. So Beta start is clamped to Thu.
    expect(alice.tasks[0].finishDate).toBe('2026-03-04')
    expect(alice.tasks[1].startDate).toBe('2026-03-05') // Thu, after Alpha frees resource
    expect(alice.tasks[1].finishDate).toBe('2026-03-06')
  })

  it('done+startDate+doneDate with actual duration differing from estimated', () => {
    // Estimated duration is 8, but actual was only 4 working days
    const cpmResults: CpmResult[] = [
      {
        taskId: 'Task:Build',
        earliestStart: 0,
        duration: 8,
        isCritical: false,
        done: true,
        startDate: '2026-03-02', // Monday
        doneDate: '2026-03-05', // Thursday (4 working days)
      },
      {
        taskId: 'Task:Test',
        earliestStart: 8,
        duration: 2,
        isCritical: false,
        done: false,
      },
    ]
    const assignments: ResourceAssignment[] = [
      { resourceName: 'Alice', taskId: 'Task:Build' },
      { resourceName: 'Alice', taskId: 'Task:Test' },
    ]

    const rows = scheduleResources(cpmResults, assignments, baseConfig, [])
    const alice = rows[0]
    // Build uses exact dates regardless of estimated duration
    expect(alice.tasks[0].startDate).toBe('2026-03-02')
    expect(alice.tasks[0].finishDate).toBe('2026-03-05')
    // Test starts after Build frees resource on Friday
    expect(alice.tasks[1].startDate).toBe('2026-03-06')
  })

  it('sorts rows by earliest start date', () => {
    const cpmResults: CpmResult[] = [
      {
        taskId: 'Task:Late',
        earliestStart: 5,
        duration: 3,
        isCritical: false,
        done: false,
      },
      {
        taskId: 'Task:Early',
        earliestStart: 0,
        duration: 3,
        isCritical: false,
        done: false,
      },
    ]
    const assignments: ResourceAssignment[] = [
      { resourceName: 'Bob', taskId: 'Task:Late' },
      { resourceName: 'Alice', taskId: 'Task:Early' },
    ]

    const rows = scheduleResources(cpmResults, assignments, baseConfig, [])
    expect(rows[0].resourceName).toBe('Alice')
    expect(rows[1].resourceName).toBe('Bob')
  })
})
