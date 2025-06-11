export type CpmInput = {
  id: string
  durationLow: number
  durationLikely: number
  durationHigh: number
  successors: string[]
}

export type CpmNode = {
  id: string
  expectedDuration: number
  variance: number
  earliestStart: number
  earliestFinish: number
  latestStart: number
  latestFinish: number
  slack: number
  isCritical: boolean
}

export type CpmArrow = {
  id: string // Example: 'A->B'
  from: string // Example: 'A'
  to: string
  isCritical: boolean
}

export type ConfidenceInterval = {
  lower: number
  upper: number
}

export type CpmPath = {
  path: string[] // Example: ['A', 'B', 'C']
  expectedDuration: number
  variance: number
  stddev: number
  confidence95: ConfidenceInterval
}

export type CpmOutput = {
  tasks: CpmNode[]
  edges: CpmArrow[]
  criticalPaths: CpmPath[]
}

export interface CpmError {
  error: string
  [key: string]: unknown
}
