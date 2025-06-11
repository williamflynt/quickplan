import { CpmError, CpmInput, CpmOutput } from './types'

class Duration {
  low: number
  likely: number
  high: number

  constructor(low: number, likely: number, high: number) {
    const values = [low, likely, high].filter((v) => v > 0)
    if (values.length === 0) {
      this.low = this.likely = this.high = 0 // milestone
    } else if (values.length === 1) {
      this.low = this.likely = this.high = values[0]
    } else if (values.length === 2) {
      const avg = (values[0] + values[1]) / 2
      this.low = low > 0 ? low : avg
      this.likely = likely > 0 ? likely : avg
      this.high = high > 0 ? high : avg
    } else {
      this.low = low
      this.likely = likely
      this.high = high
    }
  }

  get expected(): number {
    return (this.low + 4 * this.likely + this.high) / 6
  }

  get variance(): number {
    return ((this.high - this.low) / 6) ** 2
  }
}

class Task {
  id: string
  duration: Duration
  successors: string[]
  predecessors: string[] = []
  earliestStart = 0
  earliestFinish = 0
  latestStart = Infinity
  latestFinish = Infinity

  constructor(id: string, duration: Duration, successors: string[]) {
    this.id = id
    this.duration = duration
    this.successors = successors
  }

  get slack(): number {
    return this.latestStart - this.earliestStart
  }

  get isCritical(): boolean {
    return this.slack === 0
  }
}

export const runCpm = async (
  taskList: CpmInput[],
): Promise<CpmOutput | CpmError> => {
  const tasks = new Map<string, Task>()
  for (const t of taskList) {
    const duration = new Duration(
      t.durationLow || 0,
      t.durationLikely || 0,
      t.durationHigh || 0,
    )
    tasks.set(t.id, new Task(t.id, duration, t.successors))
  }

  // Check for missing successors.
  const missingSuccessors: string[] = []
  for (const task of tasks.values()) {
    for (const succId of task.successors) {
      if (!tasks.has(succId) && !missingSuccessors.includes(succId)) {
        missingSuccessors.push(succId)
      }
    }
  }
  if (missingSuccessors.length > 0) {
    return {
      error: 'Missing successor tasks',
      missingSuccessors,
    }
  }

  // Build predecessors list.
  for (const task of tasks.values()) {
    for (const succId of task.successors) {
      const succ = tasks.get(succId)
      if (succ) succ.predecessors.push(task.id)
    }
  }

  // Topological sort and check cycles.
  const order: string[] = []
  const inDegree = new Map<string, number>()
  for (const t of tasks.values()) inDegree.set(t.id, 0)
  for (const t of tasks.values()) {
    for (const s of t.successors) {
      inDegree.set(s, (inDegree.get(s) ?? 0) + 1)
    }
  }
  const queue: string[] = []
  for (const [id, deg] of inDegree.entries()) {
    if (deg === 0) queue.push(id)
  }
  while (queue.length > 0) {
    const id = queue.shift()!
    order.push(id)
    for (const succ of tasks.get(id)!.successors) {
      const d = (inDegree.get(succ) ?? 0) - 1
      inDegree.set(succ, d)
      if (d === 0) queue.push(succ)
    }
  }
  if (order.length !== tasks.size) return { error: 'Graph contains a cycle' }

  // Forward pass (earliest times).
  for (const id of order) {
    const task = tasks.get(id)!
    task.earliestStart = 0
    for (const predId of task.predecessors) {
      const pred = tasks.get(predId)!
      task.earliestStart = Math.max(task.earliestStart, pred.earliestFinish)
    }
    task.earliestFinish = task.earliestStart + task.duration.expected
  }

  // Backward pass (latest, slack).
  const maxEF = Math.max(...order.map((id) => tasks.get(id)!.earliestFinish))
  const revOrder = order.slice().reverse()
  for (const id of revOrder) {
    const task = tasks.get(id)!
    if (task.successors.length === 0) {
      task.latestFinish = maxEF
    } else {
      task.latestFinish = Math.min(
        ...task.successors.map((s) => tasks.get(s)!.latestStart),
      )
    }
    task.latestStart = task.latestFinish - task.duration.expected
  }

  // Critical path collection (can be more than one).
  const paths: string[][] = []
  function dfs(path: string[], id: string): void {
    const task = tasks.get(id)!
    if (!task.isCritical) return
    const newPath = path.concat([id])
    if (task.successors.length === 0) {
      paths.push(newPath)
      return
    }
    for (const succ of task.successors) {
      dfs(newPath, succ)
    }
  }
  for (const id of order) {
    const t = tasks.get(id)!
    if (t.predecessors.length === 0 && t.isCritical) {
      dfs([], id)
    }
  }

  // Edge output with criticality boolean.
  const edgeSet = new Set<string>()
  for (const path of paths) {
    for (let i = 0; i < path.length - 1; i++) {
      edgeSet.add(path[i] + ' > ' + path[i + 1])
    }
  }
  const edgeList: {
    id: string
    from: string
    to: string
    isCritical: boolean
  }[] = []
  for (const task of tasks.values()) {
    for (const succ of task.successors) {
      const key = task.id + ' > ' + succ
      edgeList.push({
        id: key,
        from: task.id,
        to: succ,
        isCritical: edgeSet.has(key),
      })
    }
  }

  const taskOut: {
    id: string
    expectedDuration: number
    variance: number
    earliestStart: number
    earliestFinish: number
    latestStart: number
    latestFinish: number
    slack: number
    isCritical: boolean
  }[] = []
  for (const task of tasks.values()) {
    taskOut.push({
      id: task.id,
      expectedDuration: task.duration.expected,
      variance: task.duration.variance,
      earliestStart: task.earliestStart,
      earliestFinish: task.earliestFinish,
      latestStart: task.latestStart,
      latestFinish: task.latestFinish,
      slack: task.slack,
      isCritical: task.isCritical,
    })
  }

  const pathOut: {
    path: string[]
    expectedDuration: number
    variance: number
    stddev: number
    confidence95: { lower: number; upper: number }
  }[] = []
  for (const path of paths) {
    let exp = 0.0,
      varSum = 0.0
    for (const id of path) {
      const t = tasks.get(id)!
      exp += t.duration.expected
      varSum += t.duration.variance
    }
    const stddev = Math.sqrt(varSum)
    pathOut.push({
      path,
      expectedDuration: exp,
      variance: varSum,
      stddev: stddev,
      confidence95: {
        lower: exp - 2 * stddev,
        upper: exp + 2 * stddev,
      },
    })
  }

  return {
    tasks: taskOut,
    edges: edgeList,
    criticalPaths: pathOut,
  }
}
