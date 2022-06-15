import React, {FC} from 'react'
import ReactFlow, {Background, BackgroundVariant, Controls, MiniMap} from 'react-flow-renderer';
import CpmTaskNode from "./CpmTaskNode";
import {useStore} from "../../store/store";

export const NodeTypes = {cpmTask: CpmTaskNode}

export const Flow: FC = () => {
    const { nodes, edges, onNodesChange, onEdgesChange, onConnect } = useStore();

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
