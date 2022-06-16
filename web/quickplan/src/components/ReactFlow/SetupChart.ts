import {MarkerType} from "react-flow-renderer";
import {Chart, ChartNode} from "../../api/types";
import {ChartNodeToCpmTask, CpmNodeType} from "./CpmTaskNode";
import {useStore} from "../../store/store";

export const SetupChart = (data: Chart, ovrdPositionHold?: true): void => {
    const {flowInstance, nodes, positionHold} = useStore.getState()
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
            markerEnd: {type: MarkerType.ArrowClosed},
            style: {strokeWidth: 2}
        }
        if (a.criticalPath) {
            return {...edge, style: {stroke: 'red', strokeWidth: 2}, markerEnd: {...edge.markerEnd, color: 'red'}}
        }
        return edge
    })

    useStore.setState({positionHoldCanReflow: canReflow})
    flowInstance.setNodes(n)
    flowInstance.setEdges(e)
}

const maybePositionHoldNodes = (chartNodes: ChartNode[], existingNodes: CpmNodeType[], positionHold: boolean): [CpmNodeType[], boolean] => {
    if (!positionHold) {
        // No position hold, so just return the nodes with positions as calculated by server.
        const n = chartNodes.map((n) => {
            return ChartNodeToCpmTask(n)
        })
        return [n, false]
    }

    let reflowable = false

    // Here we make a mapping of ID to existing nodes to optimize access later.
    const existingNodeMap = existingNodes.reduce<Record<string, CpmNodeType>>((coll, item) => {
        coll[item.id] = item
        return coll
    }, {})

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
