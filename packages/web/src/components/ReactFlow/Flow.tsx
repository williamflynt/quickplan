import React, { FC, useEffect, useMemo } from 'react'
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
import '../../assets/ReactFlowViewer.css'
import CpmTaskNode from './CpmTaskNode'
import { useStore } from '../../store/store'
import MilestoneNode from './MilestoneNode'
import GroupNode from './GroupNode'

export const NodeTypes = {
  cpmTask: CpmTaskNode,
  milestone: MilestoneNode,
  group: GroupNode,
}

export const Flow: FC = () => {
  const { nodes, edges, flowInstance, activeResourceFilter } = useStore()

  const onInit = (reactFlowInstance: ReactFlowInstance) => {
    useStore.setState({ flowInstance: reactFlowInstance })
  }

  // Message listener (this is run in iframe).
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.highlightNodeId) {
        const nodeId = event.data.highlightNodeId
        useStore.setState({ activeNodeId: nodeId })
        if (flowInstance) {
          setTimeout(() => {
            flowInstance.fitView({
              nodes: [{ id: nodeId }],
              padding: 0.5,
              maxZoom: 1.5,
            })
          }, 50)
        }
        return
      }

      if (event.data && 'hoverNodeId' in event.data) {
        useStore.setState({ hoveredNodeId: event.data.hoverNodeId })
        return
      }

      if (event.data && 'filterResource' in event.data) {
        const filterName: string | null = event.data.filterResource
        useStore.setState({ activeResourceFilter: filterName })

        // Fit view to matching nodes when filter is active
        if (filterName && flowInstance) {
          const { nodes: currentNodes } = useStore.getState()
          const matchingIds = currentNodes
            .filter((n) => {
              const assignments = n.data?.assignments as
                | Array<{ resourceName: string }>
                | undefined
              return assignments?.some((a) => a.resourceName === filterName)
            })
            .map((n) => n.id)

          if (matchingIds.length > 0) {
            setTimeout(() => {
              flowInstance.fitView({
                nodes: matchingIds.map((id) => ({ id })),
                padding: 0.3,
              })
            }, 50)
          }
        } else if (!filterName && flowInstance) {
          // Clear filter: fit all
          setTimeout(() => {
            flowInstance.fitView({ padding: 0.1 })
          }, 50)
        }
        return
      }

      if (event.data && event.data.nodes && event.data.edges) {
        try {
          const parsedNodes = JSON.parse(event.data.nodes)
          const parsedEdges = JSON.parse(event.data.edges)
          const calendarConfig = event.data.calendarConfig
            ? JSON.parse(event.data.calendarConfig)
            : null

          useStore.setState({
            nodes: parsedNodes,
            edges: parsedEdges,
            calendarConfig,
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

  // Compute which edges belong to the filtered resource's tasks
  const displayEdges = useMemo(() => {
    if (!activeResourceFilter) return edges
    const matchingNodeIds = new Set(
      nodes
        .filter((n) => {
          const assignments = n.data?.assignments as
            | Array<{ resourceName: string }>
            | undefined
          return assignments?.some(
            (a) => a.resourceName === activeResourceFilter,
          )
        })
        .map((n) => n.id),
    )
    return edges.map((e) => {
      const connected =
        matchingNodeIds.has(e.source) || matchingNodeIds.has(e.target)
      return connected ? e : { ...e, style: { ...e.style, opacity: 0.04 } }
    })
  }, [edges, nodes, activeResourceFilter])

  const containerClass = activeResourceFilter ? 'resource-filter-active' : ''

  return (
    <div
      style={{ flex: 1, height: '100vh', width: '100vw' }}
      className={containerClass}
    >
      <ReactFlowProvider>
        <Background variant={BackgroundVariant.Lines} />

        <ReactFlow
          // @ts-expect-error We are passing a stricter type.
          nodeTypes={NodeTypes}
          nodes={nodes}
          edges={displayEdges}
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
