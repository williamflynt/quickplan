import {MarkerType} from "react-flow-renderer";
import {Chart, ChartNode} from "../../api/types";
import {ChartNodeToCpmTask, CpmNodeType} from "./CpmTaskNode";
import {useStore} from "../../store/store";

export const SetupChart = (data: Chart): void => {
    const {flowInstance, nodes, positionHold} = useStore.getState()
    if (!flowInstance) {
        return
    }
    // Both nodes and edges can be null in the JSON body we get.
    const nodeArray = data.nodes || []
    const edgeArray = data.arrows || []

    const n = maybePositionHoldNodes(nodeArray, nodes, positionHold)

    const e = edgeArray.map((a) => {
        const edge = {
            id: a.id,
            source: a.from,
            target: a.to,
            markerEnd: {type: MarkerType.ArrowClosed},
            style: {strokeWidth: 2}
        }
        if (a.criticalPath) {
            return {...edge, style: {stroke: 'red', strokeWidth: 2}, markerEnd: {...edge.markerEnd, color: 'red'}}
        }
        return edge
    })

    flowInstance.setNodes(n)
    flowInstance.setEdges(e)
}

const maybePositionHoldNodes = (chartNodes: ChartNode[], existingNodes: CpmNodeType[], positionHold: boolean): CpmNodeType[] => {
    if (!positionHold) {
        // No position hold, so just return the nodes with positions as calculated by server.
        return chartNodes.map((n) => {
            return ChartNodeToCpmTask(n)
        })
    }

    // Here we make a mapping of ID to existing nodes to optimize access later.
    const existingNodeMap = existingNodes.reduce<Record<string, CpmNodeType>>((coll, item) => {
        coll[item.id] = item
        return coll
    }, {})

    // Every node returned from the server will be represented, but before returning it
    // we will check if we have an existing node with that ID.
    // If we DO have that existing node, overwrite the server's position with ours.
    return chartNodes.map((c) => {
        const outNode = ChartNodeToCpmTask(c)
        const eNode = existingNodeMap[c.id]
        if (!eNode) {
            return outNode
        }
        outNode.position.x = eNode.position.x
        outNode.position.y = eNode.position.y
        return outNode
    })
}
