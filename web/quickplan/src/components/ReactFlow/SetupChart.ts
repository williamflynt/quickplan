import {Edge, MarkerType, Node} from "react-flow-renderer";
import {Chart} from "../../api/types";
import {ChartNodeToCpmTask} from "./CpmTaskNode";

type setNodes = (n: Node[]) => void
type setEdges = (e: Edge[]) => void

export const SetupChart = (data: Chart, setNodes: setNodes, setEdges: setEdges): void => {
    // Both nodes and edges can be null.
    const nodeArray = data.nodes || []
    const edgeArray = data.arrows || []

    const n = nodeArray.map((n) => {
        return ChartNodeToCpmTask(n)
    })
    const e = edgeArray.map((a) => {
        const edge = {id: a.id, source: a.from, target: a.to, markerEnd: {type: MarkerType.ArrowClosed}}
        if (a.criticalPath) {
            return {...edge, style: {stroke: 'red'}, markerEnd: {...edge.markerEnd, color: 'red'}}
        }
        return edge
    })

    setNodes(n)
    setEdges(e)
}