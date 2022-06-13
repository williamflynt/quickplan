import React, {FC, useCallback, useEffect, useState} from 'react'
import ReactFlow, {
    applyEdgeChanges,
    applyNodeChanges,
    Background,
    BackgroundVariant,
    Controls,
    Edge,
    EdgeChange,
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


    useEffect(() => {
        axios.get<ChartExample>("http://localhost:3535/api/v1/graph/example")
            .then((response) => {
                    let x = 0
                    let y = 0
                    const n = response.data.nodes.map((n) => {
                        x += 100
                        y += 50
                        return {
                            id: n.id,
                            data: {label: n.label},
                            position: {x: n.position.x, y: n.position.y},
                            sourcePosition: Position.Right,
                            targetPosition: Position.Left,
                        }
                    })
                    const e = response.data.arrows.map((a) => {
                        return {id: a.id, source: a.from, target: a.to}
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
            >
                <MiniMap/>
                <Controls/>
            </ReactFlow>
        </ReactFlowProvider>
    );
}
