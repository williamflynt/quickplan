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
        return chartNodes.map((n) => {
            return ChartNodeToCpmTask(n)
        })
    }

    const idMap = chartNodes.reduce<Map<string, ChartNode>>((coll, item) => {
        coll.set(item.id, item)
        return coll
    }, new Map())

    const outNodes = existingNodes.map((n) => {
        const cNode = idMap.get(n.id)
        if (!cNode) {
            // If it's not in the nodes returned by the server, don't keep it in the Chart locally.
            return
        }
        const taskNode = ChartNodeToCpmTask(cNode)
        taskNode.position.x = n.position.x
        taskNode.position.y = n.position.y
        return taskNode
    })

    const final = outNodes.filter((n) => n !== undefined)
    return final as CpmNodeType[]
}
