import { Position } from '@xyflow/react'

export type Node = {
  type: string
  name: string
  [key: string]: unknown
}

export type Durations = {
  durationLow?: number
  durationLikely?: number
  durationHigh?: number
}

export type Task = Node & { attributes: Durations } & {
  [key: string]: unknown
}

export type Milestone = Node

export type Resource = Node

export type NodeId = { type: string; name: string }

export type Relationship = { source: NodeId; target: NodeId }

export type SerializedAssignmentIndex = Relationship[]

export type SerializedDependencyIndex = Relationship[]

export type SerializedCluster = {
  name: string
  items: Array<{ type: string; name: string }>
}

export type Project = {
  tasks: Record<string, Task>
  milestones: Record<string, Milestone>
  resources: Record<string, Resource>
  assignments: SerializedAssignmentIndex
  clusters: Record<string, SerializedCluster>
  dependencies: SerializedDependencyIndex
}

export type ProjectParseResults = {
  content: unknown
  project: Project
}

export type PreCpmNode = {
  id: string
  type: 'cpmTask' | 'milestone'
  position: {
    x: number
    y: number
  }
  data: {
    label: string
    description: string
    cpm: {
      durationLow: number
      durationLikely: number
      durationHigh: number
    }
    successors: string[]
    sourcePosition: Position
    targetPosition: Position
  }
}

export type GroupNode = {
  id: string
  type: 'group'
  position: { x: number; y: number }
  data: { label: string }
  style: {
    backgroundColor: string
    border: string
    borderRadius: number
    padding: number
  }
}

export type Edge = {
  id: string
  source: string
  target: string
  sources: string[]
  targets: string[]
  data?: Record<string, string | number | boolean>
  [key: string]: unknown
}
