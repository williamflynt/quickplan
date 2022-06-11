import React, {FC, useEffect, useState} from 'react'
import ReactFlow, {
    Background,
    BackgroundVariant,
    Controls,
    Edge,
    MiniMap,
    Node,
    ReactFlowProvider
} from 'react-flow-renderer';
import axios from "axios";
import {ChartExample} from "../../api/types";

type FlowProps = {
    nodes?: Node[],
    edges?: Edge[]
}

export const Flow: FC<FlowProps> = ({nodes, edges}) => {
    const [newNodes, nodesSet] = useState<undefined | Node[]>(undefined)
    const [newEdges, edgesSet] = useState<undefined | Edge[]>(undefined)

    useEffect(() => {
        axios.get<ChartExample>("http://localhost:3535/api/v1/graph/example")
            .then((response) => {
                    let x = 0
                    let y = 0
                    const n = response.data.nodes.map((n) => {
                        x += 100
                        y += 50
                        return {id: n.id, data: {label: n.label}, position: {x: x, y: y}}
                    })
                    const e = response.data.arrows.map((a) => {
                        return {id: a.id, source: a.from, target: a.to}
                    })
                    nodesSet(n)
                    edgesSet(e)
                }
            )
    }, [])

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

    const n = newNodes || nodes
    const e = newEdges || edges
    console.log({n, e})
    return (
        <ReactFlowProvider>
            <Background variant={BackgroundVariant.Lines}/>

            <ReactFlow defaultNodes={n} defaultEdges={e} style={{height: 750}}>
                <MiniMap/>
                <Controls/>
            </ReactFlow>
        </ReactFlowProvider>
    );
}