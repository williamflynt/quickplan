import { MarkerType } from '@xyflow/react'
import { Chart, ChartNode } from '../../api/types'
import { ChartNodeToCpmTask, CpmNodeType } from './CpmTaskNode'
import { useStore } from '../../store/store'

export const SetupChart = (data: Chart, ovrdPositionHold?: true): void => {
  const { flowInstance, nodes, positionHold, activeNodeId } =
    useStore.getState()
  if (!flowInstance) {
    return
  }
  // Both nodes and edges can be null in the JSON body we get.
  const nodeArray = data.nodes || []
  const edgeArray = data.arrows || []

  const doHold = ovrdPositionHold ? false : positionHold // Allow override to force a layout update.
  const [n, canReflow] = maybePositionHoldNodes(nodeArray, nodes, doHold)

  const e = edgeArray.map((a) => {
    const edge = {
      id: a.id,
      source: a.from,
      target: a.to,
      markerEnd: { type: MarkerType.ArrowClosed },
      style: { strokeWidth: 3 },
    }
    if (a.criticalPath) {
      return {
        ...edge,
        style: { stroke: 'red', strokeWidth: 3, opacity: 0.5 },
        markerEnd: { ...edge.markerEnd, color: 'red' },
      }
    }
    return edge
  })

  // If we made a new node, let's select it. If not, just keep what we have already set as active.
  const newActiveNodeId = maybeNewActiveNodeId(nodes, nodeArray) || activeNodeId
  // We can have an active edge that's animated, but this function will overwrite the edges.
  // So deselect that one.
  useStore.setState({
    positionHoldCanReflow: canReflow,
    activeEdgeId: null,
    activeNodeId: newActiveNodeId,
  })
  flowInstance.setNodes(n)
  flowInstance.setEdges(e)
}

/**
 * maybeNewActiveNodeId checks if there is a single new node. If so, select that one as active node.
 * This is useful to auto-select the node that is just created for editing.
 */
const maybeNewActiveNodeId = (
  oldNodes: { id: string }[],
  newNodes: { id: string }[]
): string | null => {
  if (newNodes.length - 1 !== oldNodes.length) {
    return null
  }
  const oldIdSet = oldNodes.reduce((coll, n) => {
    coll.add(n.id)
    return coll
  }, new Set<string>())
  for (let i = 0; i < newNodes.length; i++) {
    if (!oldIdSet.has(newNodes[i].id)) {
      return newNodes[i].id
    }
  }
  return null
}

const maybePositionHoldNodes = (
  chartNodes: ChartNode[],
  existingNodes: CpmNodeType[],
  positionHold: boolean
): [CpmNodeType[], boolean] => {
  if (!positionHold) {
    // No position hold, so just return the nodes with positions as calculated by server.
    const n = chartNodes.map((n) => {
      return ChartNodeToCpmTask(n)
    })
    return [n, false]
  }

  let reflowable = false

  // Here we make a mapping of ID to existing nodes to optimize access later.
  const existingNodeMap = existingNodes.reduce<Record<string, CpmNodeType>>(
    (coll, item) => {
      coll[item.id] = item
      return coll
    },
    {}
  )

  // Every node returned from the server will be represented, but before returning it
  // we will check if we have an existing node with that ID.
  // If we DO have that existing node, overwrite the server's position with ours.
  const n = chartNodes.map((c) => {
    const outNode = ChartNodeToCpmTask(c)
    const eNode = existingNodeMap[c.id]
    if (!eNode) {
      return outNode
    }
    reflowable = true
    outNode.position.x = eNode.position.x
    outNode.position.y = eNode.position.y
    return outNode
  })

  return [n, reflowable]
}
