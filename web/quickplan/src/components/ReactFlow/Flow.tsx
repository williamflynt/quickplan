import React, {FC} from 'react'
import ReactFlow, {Background, BackgroundVariant, Controls, MiniMap, ReactFlowInstance} from 'react-flow-renderer';
import CpmTaskNode from "./CpmTaskNode";
import {useStore} from "../../store/store";
import {ReflowButton} from "./ReflowButton";
import {ScaleSelectors} from "./ScaleSelectors";

export const NodeTypes = {cpmTask: CpmTaskNode}

export const Flow: FC = () => {
    const {nodes, edges, onNodesChange, onEdgesChange, onConnect, onPaneClick, onSelectionChange} = useStore();

    const onInit = (reactFlowInstance: ReactFlowInstance) => {
        useStore.setState({flowInstance: reactFlowInstance})
    }

    return (
        <>
            <Background variant={BackgroundVariant.Lines}/>

            <ReactFlow nodeTypes={NodeTypes}
                       nodes={nodes}
                       edges={edges}
                       onNodesChange={onNodesChange}
                       onEdgesChange={onEdgesChange}
                       onConnect={onConnect}
                       onInit={onInit}
                       onPaneClick={onPaneClick}
                       elevateEdgesOnSelect={true}
                       onSelectionChange={onSelectionChange}
                       fitView
            >
                <ScaleSelectors/>
                <ReflowButton/>
                <MiniMap/>
                <Controls/>
            </ReactFlow>
        </>
    )
}
