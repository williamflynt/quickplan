import {
  ResourceInfo,
  SerializedAssignmentIndex,
  CpmTaskResult,
} from '../../types/graph'

export type ScheduledTask = {
  taskName: string
  taskId: string
  start: number
  finish: number
  duration: number
  isCritical: boolean
  done: boolean
}

export type ScheduleRow = {
  resource: ResourceInfo
  tasks: ScheduledTask[]
  totalDuration: number
  utilizationPct: number
}

export function buildSchedule(
  resourceInfoMap: Map<string, ResourceInfo>,
  assignments: SerializedAssignmentIndex,
  cpmResults: Record<string, CpmTaskResult>,
): ScheduleRow[] {
  // Group assignments by resource
  const tasksByResource = new Map<string, string[]>()
  for (const a of assignments) {
    if (a.source.type !== 'Resource') continue
    const resourceName = a.source.name
    const taskId = `${a.target.type}:${a.target.name}`
    if (!tasksByResource.has(resourceName)) {
      tasksByResource.set(resourceName, [])
    }
    tasksByResource.get(resourceName)!.push(taskId)
  }

  const rows: ScheduleRow[] = []

  for (const [resourceName, taskIds] of tasksByResource) {
    const resource = resourceInfoMap.get(resourceName)
    if (!resource) continue

    // Collect tasks with CPM data, sorted by dependency order (earliest start)
    const rawTasks = taskIds
      .map((taskId) => ({ taskId, cpm: cpmResults[taskId] }))
      .filter((t) => t.cpm)
      .sort((a, b) => a.cpm.earliestStart - b.cpm.earliestStart)

    // Resource-level: a person can only work one task at a time.
    // Each task starts at the later of its CPM earliest start or when
    // this person finishes their previous task.
    const tasks: ScheduledTask[] = []
    let totalDuration = 0
    let resourceAvailableAt = 0

    for (const { taskId, cpm } of rawTasks) {
      // Use planned duration so done tasks still show their original bar width
      const dur = cpm.plannedDuration
      const start = Math.max(cpm.earliestStart, resourceAvailableAt)
      const finish = start + dur
      resourceAvailableAt = finish

      tasks.push({
        taskName: taskId.replace(/^Task:/, ''),
        taskId,
        start,
        finish,
        duration: dur,
        isCritical: cpm.isCritical,
        done: cpm.done === true,
      })
      totalDuration += dur
    }

    const utilizationPct =
      resource.maxHours > 0
        ? Math.round((totalDuration / resource.maxHours) * 100)
        : 0

    rows.push({ resource, tasks, totalDuration, utilizationPct })
  }

  // Sort by earliest task start, then latest task finish (latest last)
  rows.sort((a, b) => {
    const aStart = a.tasks.length > 0 ? a.tasks[0].start : Infinity
    const bStart = b.tasks.length > 0 ? b.tasks[0].start : Infinity
    if (aStart !== bStart) return aStart - bStart
    const aFinish = a.tasks.length > 0 ? a.tasks[a.tasks.length - 1].finish : 0
    const bFinish = b.tasks.length > 0 ? b.tasks[b.tasks.length - 1].finish : 0
    return aFinish - bFinish || a.resource.name.localeCompare(b.resource.name)
  })
  return rows
}
