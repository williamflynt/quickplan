import React, {FC, useCallback, useState} from 'react'
import ReactFlow, {
    addEdge,
    applyEdgeChanges,
    applyNodeChanges,
    Background,
    BackgroundVariant,
    Connection,
    Controls,
    Edge,
    EdgeChange,
    MiniMap,
    Node,
    NodeChange
} from 'react-flow-renderer';
import CpmTaskNode from "./CpmTaskNode";

export const NodeTypes = {cpmTask: CpmTaskNode}

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

    return (
        <>
            <Background variant={BackgroundVariant.Lines}/>

            <ReactFlow nodeTypes={NodeTypes}
                       nodes={nodes}
                       edges={edges}
                       onNodesChange={onNodesChange}
                       onEdgesChange={onEdgesChange}
                       onConnect={onConnect}
                       fitView
            >
                <MiniMap/>
                <Controls/>
            </ReactFlow>
        </>
    );
}
