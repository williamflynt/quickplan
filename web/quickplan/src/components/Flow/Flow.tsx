import React, {FC} from 'react'
import ReactFlow, {
    Background,
    BackgroundVariant,
    Controls,
    Edge,
    MiniMap,
    Node,
    ReactFlowProvider
} from 'react-flow-renderer';

type FlowProps = {
    nodes?: Node[],
    edges?: Edge[]
}

export const Flow: FC<FlowProps> = ({nodes, edges}) => {
    if (nodes === undefined && edges === undefined) {
        nodes = [
            {
                id: '1',
                type: 'input',
                data: {label: 'Input Node'},
                position: {x: 250, y: 25},
            },

            {
                id: '2',
                // you can also pass a React component as a label
                data: {label: <div>Default Node</div>},
                position: {x: 100, y: 125},
            },
            {
                id: '3',
                type: 'output',
                data: {label: 'Output Node'},
                position: {x: 250, y: 250},
            },
        ];

        edges = [
            {id: 'e1-2', source: '1', target: '2'},
            {id: 'e2-3', source: '2', target: '3', animated: true},
        ];
    }
    return (
        <ReactFlowProvider>
            <Background variant={BackgroundVariant.Lines}/>

            <ReactFlow defaultNodes={nodes} defaultEdges={edges} style={{height:750}}>
                <MiniMap/>
                <Controls/>
            </ReactFlow>
        </ReactFlowProvider>
    );
}