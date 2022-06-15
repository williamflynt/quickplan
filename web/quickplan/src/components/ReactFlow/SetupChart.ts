import {MarkerType} from "react-flow-renderer";
import {Chart} from "../../api/types";
import {ChartNodeToCpmTask} from "./CpmTaskNode";
import {useStore} from "../../store/store";

export const SetupChart = (data: Chart): void => {
    const {flowInstance} = useStore.getState()
    if (!flowInstance) {
        return
    }
    // Both nodes and edges can be null.
    const nodeArray = data.nodes || []
    const edgeArray = data.arrows || []

    const n = nodeArray.map((n) => {
        return ChartNodeToCpmTask(n)
    })

    const e = edgeArray.map((a) => {
        const edge = {id: a.id, source: a.from, target: a.to, markerEnd: {type: MarkerType.ArrowClosed}, style: {strokeWidth: 2}}
        if (a.criticalPath) {
            return {...edge, style: {stroke: 'red', strokeWidth: 2}, markerEnd: {...edge.markerEnd, color: 'red'}}
        }
        return edge
    })

    flowInstance.setNodes(n)
    flowInstance.setEdges(e)
}