import React, { FC } from 'react'
import {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  ReactFlow,
  ReactFlowInstance,
} from '@xyflow/react'
import CpmTaskNode from './CpmTaskNode'
import { useStore } from '../../store/store'
import MilestoneNode from './MilestoneNode'
// import { ReflowButton } from './ReflowButton'
// import { ScaleSelectors } from './ScaleSelectors'

export const NodeTypes = { cpmTask: CpmTaskNode, milestone: MilestoneNode }

export const Flow: FC = () => {
  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    onPaneClick,
    onSelectionChange,
  } = useStore()

  const onInit = (reactFlowInstance: ReactFlowInstance) => {
    useStore.setState({ flowInstance: reactFlowInstance })
  }
  return (
    // TODO: Put ReactFlow into an iframe
    <>
      <Background variant={BackgroundVariant.Lines} />

      <ReactFlow
        // @ts-expect-error We are passing a stricter type.
        nodeTypes={NodeTypes}
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
        nodesDraggable={true}
        nodesConnectable={false}
        connectOnClick={false}
      >
        {/*<ScaleSelectors />*/}
        {/*<ReflowButton />*/}
        <MiniMap position="bottom-right" />
        <Controls />
      </ReactFlow>
    </>
  )
}
