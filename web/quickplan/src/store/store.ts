import create from 'zustand';
import {
    applyEdgeChanges,
    applyNodeChanges,
    Connection,
    Edge,
    EdgeChange,
    Node,
    NodeChange,
    OnConnect,
    OnEdgesChange,
    OnNodesChange,
    OnSelectionChangeFunc,
    ReactFlowInstance
} from 'react-flow-renderer';
import api from "../api/api";
import {GraphDependency} from "../api/types";
import {SetupChart} from "../components/ReactFlow/SetupChart";
import {MouseEvent as ReactMouseEvent} from "react";

type RFState = {
    nodes: Node[];
    edges: Edge[];
    flowInstance: ReactFlowInstance | null,
    onNodesChange: OnNodesChange;
    onEdgesChange: OnEdgesChange;
    onConnect: OnConnect;
    onPaneClick: (event: ReactMouseEvent) => void;
    onSelectionChange: OnSelectionChangeFunc;

    activeChartId: string | null; // The cpm.Chart we're working on right now.
    activeEdgeId: string | null; // The edge that is clicked/active. This is what will show in nodeTools.
    activeNodeId: string | null; // The node that is clicked/active. This is what will show in nodeTools.
    nodeToolsVisible: boolean // Are the node tools open or closed?

    positionHold: boolean // Hold positions of nodes on new data, or reflow every time?
    positionHoldCanReflow: boolean // Is there updated information from the server on position?
    positionScaleX: number // How much to scale the server-provided coords in the horizontal axis.
    positionScaleY: number // How much to scale the server-provided coords in the vertical axis.
};

export const useStore = create<RFState>((set, get) => ({
    nodes: [],
    edges: [],
    flowInstance: null,
    onNodesChange: (changes: NodeChange[]) => {
        set({
            nodes: applyNodeChanges(changes, get().nodes),
        });
    },
    onEdgesChange: (changes: EdgeChange[]) => {
        set({
            edges: applyEdgeChanges(changes, get().edges),
        });
    },
    onConnect: (connection: Connection) => {
        const graphId = get().activeChartId
        if (graphId && connection.source && connection.target) {
            const d: GraphDependency = {firstId: connection.source, nextId: connection.target}
            api.graphDependencyNew(graphId, JSON.stringify(d)).then((response) => {
                SetupChart(response.data)
            })
        }
    },
    onPaneClick: () => {
        // Deselect any selected Edge (and un-animate it).
        const newEdges = get().edges.map((e) => {
            return {...e, animated: false}
        })
        set({activeEdgeId: null, edges: newEdges})
    },
    onSelectionChange: ({edges}) => {
        // If we select an Edge, animate it and set that ID to active.
        if (edges.length > 0) {
            const eId = edges[0].id
            const newEdges = get().edges.map((e) => {
                if (e.id !== eId) {
                    return {...e, animated: false}
                }
                return {...e, animated: true}
            })
            set({activeEdgeId: eId, edges: newEdges})
        }
    },
    activeChartId: null,
    activeEdgeId: null,
    activeNodeId: null,
    nodeToolsVisible: false,
    positionHold: true,
    positionHoldCanReflow: false,
    positionScaleX: 3.5,
    positionScaleY: 1.5,
}));
