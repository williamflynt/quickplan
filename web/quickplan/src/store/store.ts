import create from 'zustand'
import { Edge, Node, ReactFlowInstance } from '@xyflow/react'

type RFState = {
  nodes: Node[]
  edges: Edge[]
  flowInstance: ReactFlowInstance | null
  activeChartId: string | null // The cpm.Chart we're working on right now.
  activeEdgeId: string | null // The edge that is clicked/active. This is what will show in nodeTools.
  activeNodeId: string | null // The node that is clicked/active. This is what will show in nodeTools.
  nodeToolsVisible: boolean // Are the node tools open or closed?

  positionHold: boolean // Hold positions of nodes on new data, or reflow every time?
  positionHoldCanReflow: boolean // Is there updated information from the server on position?
  positionScaleX: number // How much to scale the server-provided coords in the horizontal axis.
  positionScaleY: number // How much to scale the server-provided coords in the vertical axis.
}

export const useStore = create<RFState>((set, get) => ({
  nodes: [],
  edges: [],
  flowInstance: null,
  activeChartId: null,
  activeEdgeId: null,
  activeNodeId: null,
  nodeToolsVisible: false,
  positionHold: true,
  positionHoldCanReflow: false,
  positionScaleX: 3.5,
  positionScaleY: 1.5,
}))
