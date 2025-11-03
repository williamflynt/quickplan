import { MarkerType } from '@xyflow/react'
import { SerializedDependencyIndex, Edge } from '../../types/graph'

export function buildDependencyEdges(dependencies: SerializedDependencyIndex): Edge[] {
  return dependencies.map((e) => {
    const srcId = `${e.source.type}:${e.source.name}`
    const tgtId = `${e.target.type}:${e.target.name}`
    return {
      id: [srcId, tgtId].join(' > '),
      source: srcId,
      target: tgtId,
      sources: [srcId],
      targets: [tgtId],
      markerEnd: { type: MarkerType.ArrowClosed },
      style: { strokeWidth: 3 },
    }
  })
}
