import { MarkerType } from '@xyflow/react'
import { PreCpmNode, Edge } from '../../types/graph'
import { CpmInput, CpmOutput, CpmArrow } from '@quickplan/cpm'

export type CpmMode = 'planning' | 'remaining'

export function nodesForCpm(
  edges: Edge[],
  nodes: PreCpmNode[],
  mode: CpmMode = 'remaining',
): CpmInput[] {
  const cpmInput: CpmInput[] = []

  for (const node of nodes) {
    const successors = edges
      .filter((e) => e.source === node.id)
      .map((e) => e.target)

    // In 'remaining' mode, done tasks get duration 0 so they don't
    // contribute to the critical path. In 'planning' mode, all tasks
    // keep their original durations for display values.
    const zeroed = mode === 'remaining' && node.data.done === true
    cpmInput.push({
      id: node.id,
      durationLow: zeroed ? 0 : node.data.cpm.durationLow,
      durationLikely: zeroed ? 0 : node.data.cpm.durationLikely,
      durationHigh: zeroed ? 0 : node.data.cpm.durationHigh,
      successors,
    })
  }

  return cpmInput
}

export function applyCpmResults(
  nodes: PreCpmNode[],
  planningCpm: CpmOutput,
  remainingCpm: CpmOutput,
): PreCpmNode[] {
  const planningMap = new Map(planningCpm.tasks.map((t) => [t.id, t]))
  const remainingMap = new Map(remainingCpm.tasks.map((t) => [t.id, t]))

  return nodes.map((node) => {
    const planning = planningMap.get(node.id)
    if (!planning) return node

    const remaining = remainingMap.get(node.id)
    const isDone = node.data.done === true

    return {
      ...node,
      data: {
        ...node.data,
        cpm: {
          ...node.data.cpm,
          earliestStart: planning.earliestStart,
          earliestFinish: planning.earliestFinish,
          latestStart: planning.latestStart,
          latestFinish: planning.latestFinish,
          slack: planning.slack,
          duration: planning.expectedDuration,
          pathVariance: remaining?.pathVariance ?? planning.pathVariance,
          isCritical: (remaining?.isCritical ?? false) && !isDone,
        },
      },
    }
  })
}

export function applyCpmToEdges(
  edges: Edge[],
  cpmOutput: CpmOutput,
  doneNodeIds?: Set<string>,
): Edge[] {
  const cpmArrowsMap: Record<string, CpmArrow> = {}
  cpmOutput.edges.forEach((arrow) => {
    cpmArrowsMap[arrow.id] = arrow
  })

  return edges.map((e) => {
    const cpmArrow = cpmArrowsMap[e.id]
    if (!cpmArrow) return e

    // Edges from done tasks are not part of the active critical path
    const fromDone = doneNodeIds?.has(cpmArrow.from) ?? false
    const isCritical = cpmArrow.isCritical && !fromDone

    const updatedEdge: any = {
      ...e,
      data: {
        ...e.data,
        criticalPath: isCritical,
      },
    }

    if (isCritical) {
      updatedEdge.style = { stroke: 'red', strokeWidth: 3, opacity: 0.5 }
      updatedEdge.markerEnd = { type: MarkerType.ArrowClosed, color: 'red' }
    }

    return updatedEdge
  })
}
