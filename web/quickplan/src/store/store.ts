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

type RFState = {
    nodes: Node[];
    edges: Edge[];
    flowInstance: ReactFlowInstance | null,
    onNodesChange: OnNodesChange;
    onEdgesChange: OnEdgesChange;
    onConnect: OnConnect;
    onSelectionChange: OnSelectionChangeFunc;

    activeChartId: string | null; // The cpm.Chart we're working on right now.
    activeEdgeId: string | null; // The edge that is clicked/active. This is what will show in nodeTools.
    activeNodeId: string | null; // The node that is clicked/active. This is what will show in nodeTools.
    nodeToolsVisible: boolean // Are the node tools open or closed?
    positionHold: boolean // Hold positions of nodes on new data, or reflow every time?
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
    onSelectionChange: ({edges}) => {
        if (edges.length > 0) {
            set({activeEdgeId: edges[0].id})
        }
    },
    activeChartId: null,
    activeEdgeId: null,
    activeNodeId: null,
    nodeToolsVisible: false,
    positionHold: true,
}));
