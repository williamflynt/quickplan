import React, { CSSProperties, FC, useEffect, useRef, useState } from 'react'
import { executeExtended } from '../../../submodules/ProjectFlowSyntax/project-flow-syntax/src/setupExtended'
import { configureMonacoWorkers } from '../../../submodules/ProjectFlowSyntax/project-flow-syntax/src/setupCommon'
import { Monaco } from './components/Monaco'
import { Flow } from './components/ReactFlow/Flow'
import {
  MarkerType,
  Position,
  ReactFlowInstance,
  ReactFlowProvider,
} from '@xyflow/react'
import { useStore } from './store/store'
import ELK, { ElkNode, LayoutOptions } from 'elkjs/lib/elk.bundled.js'
import { runCpm } from './wasm/wasmLoader'
import 'antd/dist/antd.css'
import './assets/App.css'
import '@xyflow/react/dist/style.css'
import { CpmNodeData, CpmNodeShape } from './components/ReactFlow/CpmTaskNode'

import {
  CpmData,
  WasmArrow,
  WasmCpmInput,
  WasmCpmOutput,
  WasmNode,
} from './wasm/types'

// Constants for layout breakpoints
const BREAKPOINT_NARROW = 768 // px - Switch to ~80 columns.
const BREAKPOINT_VERTICAL = 576 // px - Switch to vertical layout.
const elk = new ELK() // Layout engine!

type UiLayout = 'wide' | 'narrow' | 'vertical'

export const App: FC = () => {
  // Refs for DOM elements and Monaco instances
  const editorRef = useRef<HTMLDivElement>(null)
  const wrapperRef = useRef<any>(null)
  const languageClientRef = useRef<any>(null)

  // State for layout management
  const [layout, setLayout] = useState<UiLayout>('wide')
  const flowInstance = useStore((state) => state.flowInstance)

  // TODO: Total refactor
  // TODO: Resources and Assignments and Clusters
  // TODO: Figure out why Monaco editor freezes and does weird stuff
  // TODO: Delete unused code/files in the project

  // Initialize Monaco editor and language client.
  useEffect(() => {
    if (!editorRef.current) return

    configureMonacoWorkers()
    void executeExtended(editorRef.current).then(
      ({ wrapper, languageClient }) => {
        wrapperRef.current = wrapper
        languageClientRef.current = languageClient
        // Set up notification handler to update ReactFlow every time source code is edited.
        languageClient.onNotification(
          'browser/DocumentChange',
          (params: { content: string; project: string }) => {
            // Update the ReactFlow graph depiction with parse results from editor hook.
            const content = JSON.parse(params.content) // Parse results of DSL.
            const project = JSON.parse(params.project) // Extract project entities.
            updateFlowFromDocument(flowInstance, { content, project })
          },
        )
      },
    )

    return () => {
      // TODO: Cleanup logic for Monaco editor if needed.
      if (wrapperRef.current) {
        // Nothing yet.
      }
    }
  }, [editorRef.current, flowInstance])

  // Handle window resize for responsive layout.
  // This is probably not the way to do it.
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < BREAKPOINT_VERTICAL) {
        setLayout('vertical')
      } else if (window.innerWidth < BREAKPOINT_NARROW) {
        setLayout('narrow')
      } else {
        setLayout('wide')
      }
    }

    window.addEventListener('resize', handleResize)
    handleResize() // Set initial layout

    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  const styles = getUiLayoutStyles(layout)

  return (
    <ReactFlowProvider>
      <div
        style={{
          display: 'flex',
          ...styles.container,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            ...styles.editor,
            overflow: 'hidden',
            border: '1px solid #ddd',
            boxShadow: '0 0 8px rgba(0,0,0,0.1)',
          }}
        >
          <Monaco
            editorRef={editorRef}
            style={{ width: '100%', height: '100%' }}
          />
        </div>

        <div
          style={{
            ...styles.flow,
            overflow: 'hidden',
            border: '1px solid #ddd',
            boxShadow: '0 0 8px rgba(0,0,0,0.1)',
          }}
        >
          <Flow />
        </div>
      </div>
    </ReactFlowProvider>
  )
}

// Get styles based on current layout.
const getUiLayoutStyles = (mode: UiLayout): Record<string, CSSProperties> => {
  switch (mode) {
    case 'vertical':
      return {
        container: {
          flexDirection: 'column',
          height: '100vh',
        },
        editor: {
          width: '100%',
          height: '30vh',
        },
        flow: {
          width: '100%',
          height: '70vh',
        },
      }
    case 'narrow':
      return {
        container: {
          flexDirection: 'row',
          height: '100vh',
        },
        editor: {
          width: '400px',
          height: '100%',
        },
        flow: {
          flex: 1,
          height: '100%',
        },
      }
    case 'wide':
    default:
      return {
        container: {
          flexDirection: 'row',
          height: '100vh',
        },
        editor: {
          width: '25%',
          height: '100%',
        },
        flow: {
          flex: 1,
          height: '100%',
        },
      }
  }
}

/*
 * These types say that we're creating the same shape as the final node, but
 * without all the calculations completed for critical path.
 */

type CpmDataPartial = Pick<
  CpmData,
  'durationLow' | 'durationLikely' | 'durationHigh'
>
type CpmNodeDataPartial = Omit<CpmNodeData, 'cpm'> & { cpm: CpmDataPartial }
type CpmNodePrecalc = Omit<CpmNodeShape, 'data'> & { data: CpmNodeDataPartial }

type Node = {
  type: string
  name: string
  attributes: Record<string, string | number>
}

type Durations = {
  durationLow?: number
  durationLikely?: number
  durationHigh?: number
}

type Task = Node & { attributes: Durations } & {
  attributes: { description?: string }
}

type Milestone = Node
type Resource = Node
type NodeId = { type: string; name: string }
type Relationship = { source: NodeId; target: NodeId }
type SerializedAssignmentIndex = Relationship[]
type SerializedDependencyIndex = Relationship[]
type SerializedCluster = unknown // TODO.

type Project = {
  tasks: Record<string, Task>
  milestones: Record<string, Milestone>
  resources: Record<string, Resource>
  assignments: SerializedAssignmentIndex
  clusters: Record<string, SerializedCluster>
  dependencies: SerializedDependencyIndex
}

type ProjectParseResults = {
  content: unknown
  project: Project
}

type Edge = {
  id: string
  source: string
  target: string
  sources: string[]
  targets: string[]
  data?: Record<string, string | number | boolean>

  [key: string]: unknown
}

const updateFlowFromDocument = (
  flowInstance: ReactFlowInstance | null,
  data: ProjectParseResults,
) => {
  const edges: Edge[] = data.project.dependencies.map((e) => {
    const srcId = `${e.source.type}:${e.source.name}`
    const tgtId = `${e.target.type}:${e.target.name}`
    return {
      id: [srcId, tgtId].join(' > '),
      source: srcId,
      target: tgtId,
      sources: [srcId], // For ELK.
      targets: [tgtId], // For ELK.
      markerEnd: { type: MarkerType.ArrowClosed }, // For ReactFlow.
      style: { strokeWidth: 3 }, // For ReactFlow.
    }
  })
  const taskNodes = Object.values(data.project.tasks).map((t) => {
    return {
      id: `${t.type}:${t.name}`,
      type: 'cpmTask',
      position: { x: 0, y: 0 },
      data: {
        label: t.name,
        description: t.name + t.name,
        cpm: {
          durationLow: t.attributes.durationLow || 1,
          durationLikely: t.attributes.durationLikely || 2,
          durationHigh: t.attributes.durationHigh || 3,
        },
        predecessors: [],
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
      },
    }
  })
  const milestoneNodes = Object.values(data.project.milestones).map((m) => {
    return {
      id: `${m.type}:${m.name}`,
      type: 'milestone',
      position: { x: 0, y: 0 },
      data: {
        label: m.name,
        description: '',
        cpm: { durationLow: 0, durationLikely: 0, durationHigh: 0 },
      },
      predecessors: [],
      sourcePosition: Position.Right,
      targetPosition: Position.Left,
    }
  })

  const allNodes: CpmNodePrecalc[] = [...taskNodes, ...milestoneNodes]

  void runCpm(nodesForWasm(edges, allNodes))
    .then((chart: WasmCpmOutput) => {
      // Create lookup maps for better runtime complexity.
      const cpmNodesMap: Record<string, WasmNode> = {}
      chart.nodes.forEach((cpmNode) => {
        cpmNodesMap[cpmNode.id] = cpmNode
      })

      const cpmArrowsMap: Record<string, WasmArrow> = {}
      chart.arrows.forEach((arrow) => {
        cpmArrowsMap[`${arrow.from} > ${arrow.to}`] = arrow
      })

      // Update nodes with CPM data
      const updatedNodes = allNodes.map((node) => {
        const cpmNode = cpmNodesMap[node.id]
        if (!cpmNode) return node

        return {
          ...node,
          data: {
            ...node.data,
            cpm: {
              ...node.data.cpm,
              earliestStart: cpmNode.earliestStart,
              earliestFinish: cpmNode.earliestFinish,
              latestStart: cpmNode.latestStart,
              latestFinish: cpmNode.latestFinish,
              slack: cpmNode.slack,
              duration: cpmNode.duration,
            },
          },
        }
      })

      // Update edges with critical path indicators
      const updatedEdges = edges.map((edge) => {
        const cpmArrow = cpmArrowsMap[edge.id]
        if (!cpmArrow) return edge

        const e: Edge = {
          ...edge,
          data: {
            ...edge.data,
            criticalPath: cpmArrow.criticalPath,
          },
        }
        if (e.data?.criticalPath) {
          e.style = { stroke: 'red', strokeWidth: 3, opacity: 0.5 }
          e.markerEnd = { type: MarkerType.ArrowClosed, color: 'red' }
        }
        return e
      })

      return doLayout([...updatedNodes, ...milestoneNodes], updatedEdges)
    })
    .then(([nodesPositioned, edgesPositioned]) => {
      if (!flowInstance) return
      flowInstance.setNodes(nodesPositioned)
      flowInstance.setEdges(edgesPositioned)
    })
}

const LAYOUT_OPTIONS: LayoutOptions = {
  'elk.algorithm': 'layered',
  'elk.direction': 'RIGHT',
  'elk.layered.spacing.nodeNodeBetweenLayers': '100',
  'elk.spacing.nodeNode': '80',
}

const doLayout = async <T extends { id: string }>(
  nodes: T[],
  edges: Edge[],
): Promise<[T[], Edge[]]> => {
  const graph: ElkNode = {
    id: 'root',
    layoutOptions: LAYOUT_OPTIONS,
    children: nodes.map((n) => {
      return { ...n, width: 150, height: 100 }
    }),
    edges: edges,
  }
  return elk.layout(graph).then(({ children }) => {
    if (!children) {
      throw new Error('no nodes returned from Elk')
    }
    const positionedNodes = children.map((node) => {
      return { ...node, position: { x: node.x, y: node.y } } as unknown as T
    })
    return [positionedNodes, edges]
  })
}

/**
 * Transform a CpmTaskNode into the shape our WASM bundle expects:
 *
 * type jsTask struct {
 *    Uid_           string            `json:"uid"`
 *    Title_         string            `json:"title"`
 *    Description_   string            `json:"description"`
 *    Meta_          map[string]string `json:"meta"`
 *    DurationLow    int               `json:"durationLow"`
 *    DurationLikely int               `json:"durationLikely"`
 *    DurationHigh   int               `json:"durationHigh"`
 *    Predecessors_  []string          `json:"predecessors"`
 * }
 *
 */
const nodesForWasm = (
  edges: Edge[],
  nodes: CpmNodePrecalc[],
): WasmCpmInput[] => {
  // First get a map of { target: predecessor[] } from edges.
  const predMap: Record<string, string[]> = {}
  for (const { source, targets } of edges) {
    for (const target of targets) {
      if (!predMap[target]) {
        predMap[target] = [source]
        continue
      }
      predMap[target].push(source)
    }
  }
  return nodes.map((n) => {
    return {
      uid: n.id,
      title: '$RESET',
      description: n.data.description,
      meta: {},
      durationLow: n.data.cpm.durationLow,
      durationLikely: n.data.cpm.durationLikely,
      durationHigh: n.data.cpm.durationHigh,
      predecessors: predMap[n.id],
    }
  })
}
