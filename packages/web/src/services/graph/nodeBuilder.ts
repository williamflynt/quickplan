import { Position } from '@xyflow/react'
import {
  Task,
  Milestone,
  SerializedCluster,
  PreCpmNode,
  GroupNode,
  SerializedAssignmentIndex,
  ResourceInfo,
  TaskAssignment,
} from '../../types/graph'
import { getTaskAssignments } from '../resource/resourceUtils'

export function buildTaskNodes(
  tasks: Record<string, Task>,
  assignments?: SerializedAssignmentIndex,
  resourceInfoMap?: Map<string, ResourceInfo>,
): PreCpmNode[] {
  return Object.values(tasks).map((t) => {
    const taskAssignments: TaskAssignment[] | undefined =
      assignments && resourceInfoMap
        ? getTaskAssignments(t.name, assignments, resourceInfoMap)
        : undefined

    return {
      id: `${t.type}:${t.name}`,
      type: 'cpmTask' as const,
      position: { x: 0, y: 0 },
      data: {
        label: t.name,
        description: (
          (t.attributes as any).description || 'No description'
        ).toString(),
        cpm: {
          durationLow: t.attributes.durationLow || 0,
          durationLikely: t.attributes.durationLikely || 0,
          durationHigh: t.attributes.durationHigh || 0,
        },
        assignments: taskAssignments?.length ? taskAssignments : undefined,
        done: (() => {
          const rawDone = String((t.attributes as any).done ?? '')
          const stripped = rawDone.replace(/"/g, '')
          if (/^true$/i.test(stripped)) return true
          if (/^\d{4}-\d{2}-\d{2}$/.test(stripped)) return true
          return undefined
        })(),
        doneDate: (() => {
          const rawDone = String((t.attributes as any).done ?? '')
          const stripped = rawDone.replace(/"/g, '')
          return /^\d{4}-\d{2}-\d{2}$/.test(stripped) ? stripped : undefined
        })(),
        startDate: (() => {
          const rawStart = String((t.attributes as any).start ?? '')
          const stripped = rawStart.replace(/"/g, '')
          return /^\d{4}-\d{2}-\d{2}$/.test(stripped) ? stripped : undefined
        })(),
        successors: [],
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
      },
    }
  })
}

export function buildMilestoneNodes(
  milestones: Record<string, Milestone>,
): PreCpmNode[] {
  return Object.values(milestones).map((m) => ({
    id: `${m.type}:${m.name}`,
    type: 'milestone' as const,
    position: { x: 0, y: 0 },
    data: {
      label: m.name,
      description: (
        (m as any).attributes?.description || 'No description'
      ).toString(),
      cpm: { durationLow: 0, durationLikely: 0, durationHigh: 0 },
      successors: [],
      sourcePosition: Position.Right,
      targetPosition: Position.Left,
    },
  }))
}

export function buildClusterNodes(
  clusters: Record<string, SerializedCluster>,
): GroupNode[] {
  return Object.values(clusters).map((cluster) => ({
    id: `Cluster:${cluster.name}`,
    type: 'group' as const,
    position: { x: 0, y: 0 },
    data: { label: cluster.name },
    style: {
      backgroundColor: 'rgba(200, 220, 255, 0.15)',
      border: '2px dashed rgba(100, 150, 200, 0.4)',
      borderRadius: 8,
      padding: 20,
    },
  }))
}

export function applyClusterMembership(
  taskNodes: PreCpmNode[],
  milestoneNodes: PreCpmNode[],
  clusters: Record<string, SerializedCluster>,
): void {
  // Build cluster membership map
  const nodeToCluster = new Map<string, string>()
  for (const cluster of Object.values(clusters)) {
    for (const item of cluster.items) {
      const nodeId = `${item.type}:${item.name}`
      nodeToCluster.set(nodeId, `Cluster:${cluster.name}`)
    }
  }

  // Apply parentId to nodes
  const applyParentId = (nodes: PreCpmNode[]) => {
    nodes.forEach((node) => {
      const parentId = nodeToCluster.get(node.id)
      if (parentId) {
        ;(node as any).parentId = parentId
      }
    })
  }

  applyParentId(taskNodes)
  applyParentId(milestoneNodes)
}
