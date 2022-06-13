import React, {FC, useCallback, useEffect, useState} from 'react'
import ReactFlow, {
    addEdge,
    applyEdgeChanges,
    applyNodeChanges,
    Background,
    BackgroundVariant,
    Connection,
    Controls,
    Edge,
    EdgeChange, MarkerType,
    MiniMap,
    Node,
    NodeChange, Position,
    ReactFlowProvider
} from 'react-flow-renderer';
import axios from "axios";
import {ChartExample} from "../../api/types";

export const Flow: FC = () => {
    const [nodes, nodesSet] = useState<Node[]>([])
    const [edges, edgesSet] = useState<Edge[]>([])

    const onNodesChange = useCallback(
        (changes: NodeChange[]) => nodesSet((nds) => applyNodeChanges(changes, nds)),
        [nodesSet]
    );
    const onEdgesChange = useCallback(
        (changes: EdgeChange[]) => edgesSet((eds) => applyEdgeChanges(changes, eds)),
        [edgesSet]
    );
    const onConnect = useCallback(
        (connection: Edge<any> | Connection) => edgesSet((eds) => addEdge(connection, eds)),
        [edgesSet]
    );


    useEffect(() => {
        axios.get<ChartExample>("http://localhost:3535/api/v1/graph/example")
            .then((response) => {
                    const n = response.data.nodes.map((n) => {
                        return {
                            id: n.id,
                            data: {label: n.label},
                            // Scale positions to avoid clustering.
                            position: {x: n.position.x * 2, y: n.position.y * 3},
                            sourcePosition: Position.Right,
                            targetPosition: Position.Left,
                        }
                    })
                    const e = response.data.arrows.map((a) => {
                        const edge = {id: a.id, source: a.from, target: a.to, markerEnd: {type: MarkerType.ArrowClosed}}
                        if (a.criticalPath) {
                            return {...edge, style: {stroke: 'red'}, markerEnd: {...edge.markerEnd, color: 'red'}}
                        }
                        return edge
                    })
                    nodesSet(n)
                    edgesSet(e)
                }
            )
    }, [])

    return (
        <ReactFlowProvider>
            <Background variant={BackgroundVariant.Lines}/>

            <ReactFlow nodes={nodes}
                       edges={edges}
                       onNodesChange={onNodesChange}
                       onEdgesChange={onEdgesChange}
                       onConnect={onConnect}
                       fitView
            >
                <MiniMap/>
                <Controls/>
            </ReactFlow>
        </ReactFlowProvider>
    );
}
