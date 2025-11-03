import { MarkerType } from '@xyflow/react'
import { PreCpmNode, Edge } from '../../types/graph'
import { CpmInput, CpmOutput, CpmArrow } from '../../cpm/types'

export function nodesForCpm(edges: Edge[], nodes: PreCpmNode[]): CpmInput[] {
  const cpmInput: CpmInput[] = []

  for (const node of nodes) {
    const successors = edges
      .filter((e) => e.source === node.id)
      .map((e) => e.target)

    cpmInput.push({
      id: node.id,
      durationLow: node.data.cpm.durationLow,
      durationLikely: node.data.cpm.durationLikely,
      durationHigh: node.data.cpm.durationHigh,
      successors,
    })
  }

  return cpmInput
}

export function applyCpmResults(
  nodes: PreCpmNode[],
  cpmOutput: CpmOutput,
): PreCpmNode[] {
  const cpmNodesMap: Record<string, any> = {}
  cpmOutput.tasks.forEach((cpmNode) => {
    cpmNodesMap[cpmNode.id] = cpmNode
  })

  return nodes.map((node) => {
    const cpmNode = cpmNodesMap[node.id]
    if (!cpmNode) return node

    return {
      ...node,
      data: {
        ...node.data,
        cpm: {
          ...node.data.cpm,
          earliestStart: cpmNode.earliestStart,
          earliestFinish: cpmNode.earliestFinish,
          latestStart: cpmNode.latestStart,
          latestFinish: cpmNode.latestFinish,
          slack: cpmNode.slack,
          duration: cpmNode.expectedDuration,
        },
      },
    }
  })
}

export function applyCpmToEdges(edges: Edge[], cpmOutput: CpmOutput): Edge[] {
  const cpmArrowsMap: Record<string, CpmArrow> = {}
  cpmOutput.edges.forEach((arrow) => {
    cpmArrowsMap[arrow.id] = arrow
  })

  return edges.map((e) => {
    const cpmArrow = cpmArrowsMap[e.id]
    if (!cpmArrow) return e

    const updatedEdge: any = {
      ...e,
      data: {
        ...e.data,
        criticalPath: cpmArrow.isCritical,
      },
    }

    if (updatedEdge.data?.criticalPath) {
      updatedEdge.style = { stroke: 'red', strokeWidth: 3, opacity: 0.5 }
      updatedEdge.markerEnd = { type: MarkerType.ArrowClosed, color: 'red' }
    }

    return updatedEdge
  })
}
