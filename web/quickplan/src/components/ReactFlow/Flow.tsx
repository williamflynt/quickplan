import React, { FC, useEffect } from 'react'
import {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  ReactFlow,
  ReactFlowInstance,
  ReactFlowProvider,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import 'antd/dist/antd.css'
import '../../assets/ReactFlowViewer.css'
import CpmTaskNode from './CpmTaskNode'
import { useStore } from '../../store/store'
import MilestoneNode from './MilestoneNode'

export const NodeTypes = { cpmTask: CpmTaskNode, milestone: MilestoneNode }

export const Flow: FC = () => {
  const { nodes, edges, flowInstance } = useStore()

  const onInit = (reactFlowInstance: ReactFlowInstance) => {
    useStore.setState({ flowInstance: reactFlowInstance })
  }

  // Message listener (this is run in iframe).
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.nodes && event.data.edges) {
        try {
          const parsedNodes = JSON.parse(event.data.nodes)
          const parsedEdges = JSON.parse(event.data.edges)

          useStore.setState({
            nodes: parsedNodes,
            edges: parsedEdges,
          })

          if (flowInstance) {
            setTimeout(() => {
              flowInstance.fitView({ padding: 0.1 })
            }, 50)
          }
        } catch (error) {
          console.error('Error parsing message data:', error)
        }
      }
    }

    window.addEventListener('message', handleMessage)

    // Cleanup listener on unmount.
    return () => {
      window.removeEventListener('message', handleMessage)
    }
  }, [flowInstance])

  return (
    <div style={{ flex: 1, height: '100vh', width: '100vw' }}>
      <ReactFlowProvider>
        <Background variant={BackgroundVariant.Lines} />

        <ReactFlow
          // @ts-expect-error We are passing a stricter type.
          nodeTypes={NodeTypes}
          nodes={nodes}
          edges={edges}
          onInit={onInit}
          elevateEdgesOnSelect={true}
          fitView
          nodesDraggable={true}
          nodesConnectable={false}
          connectOnClick={false}
        >
          <MiniMap position="bottom-right" />
          <Controls />
        </ReactFlow>
      </ReactFlowProvider>
    </div>
  )
}
