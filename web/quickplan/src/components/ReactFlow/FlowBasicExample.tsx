import React, {FC, useEffect} from 'react'
import api from "../../api/api";
import {Flow} from "./Flow";
import {ChartNodeToCpmTask} from "./CpmTaskNode";
import {MarkerType, useReactFlow} from "react-flow-renderer";

export const FlowBasicExample: FC = () => {
    const {setNodes, setEdges} = useReactFlow()

    useEffect(() => {
        api.graphExample().then((response) => {
                const n = response.data.nodes.map((n) => {
                    return ChartNodeToCpmTask(n)
                })
                const e = response.data.arrows.map((a) => {
                    const edge = {id: a.id, source: a.from, target: a.to, markerEnd: {type: MarkerType.ArrowClosed}}
                    if (a.criticalPath) {
                        return {...edge, style: {stroke: 'red'}, markerEnd: {...edge.markerEnd, color: 'red'}}
                    }
                    return edge
                })

                setNodes(n)
                setEdges(e)
            }
        )
    }, [])

    return <Flow/>
}
