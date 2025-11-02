import React, {
  CSSProperties,
  FC,
  RefObject,
  useEffect,
  useRef,
  useState,
} from 'react'
import { executeExtended } from '@quickplan/project-flow-syntax/src/setupExtended'
import { configureMonacoWorkers } from '@quickplan/project-flow-syntax/src/setupCommon'
import { Monaco } from './components/Editor/Monaco'
import { ResizablePanels } from './components/ResizablePanels'
import { MarkerType, Position } from '@xyflow/react'
import ELK, { ElkNode, LayoutOptions } from 'elkjs/lib/elk.bundled.js'
import { runCpm } from './cpm/cpm'
import 'antd/dist/antd.css'

import { CpmArrow, CpmInput, CpmOutput, CpmNode, CpmError } from './cpm/types'

// Constants for layout breakpoints
const BREAKPOINT_NARROW = 768 // px - Switch to ~80 columns.
const BREAKPOINT_VERTICAL = 576 // px - Switch to vertical layout.
const elk = new ELK() // Node layout engine!

type UiLayout = 'wide' | 'narrow' | 'vertical'

export const App: FC = () => {
  // Refs for DOM elements and Monaco instances
  const editorRef = useRef<HTMLDivElement>(null)
  const wrapperRef = useRef<any>(null)
  const languageClientRef = useRef<any>(null)

  const iframeRef = useRef<HTMLIFrameElement>(null)

  // State for layout management
  const [layout, setLayout] = useState<UiLayout>('wide')

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
            updateFlowFromDocument({ content, project }, iframeRef)
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
  }, [editorRef.current])

  // Handle window resize for responsive layout.
  // This is probably not the way to do it.
  useEffect(() => {
    const handleResize = () => {
      if (
        window.innerWidth < BREAKPOINT_VERTICAL ||
        window.innerHeight >= window.innerWidth * 1.7
      ) {
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

  const editorPane = (
    <div
      style={{
        width: '100%',
        height: '100%',
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
  )

  const flowPane = (
    <div
      style={{
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        border: '1px solid #ddd',
        boxShadow: '0 0 8px rgba(0,0,0,0.1)',
      }}
    >
      <iframe
        ref={iframeRef}
        src="/index-reactflow.html"
        sandbox="allow-scripts allow-same-origin"
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  )

  return (
    <div
      style={{
        ...styles.container,
        overflow: 'hidden',
      }}
    >
      <ResizablePanels
        leftPane={editorPane}
        rightPane={flowPane}
        defaultLeftWidth={styles.defaultLeftWidth}
        minLeftWidth={styles.minLeftWidth}
        maxLeftWidth={styles.maxLeftWidth}
        direction={layout === 'vertical' ? 'vertical' : 'horizontal'}
      />
    </div>
  )
}

// Get styles based on current layout.
const getUiLayoutStyles = (
  mode: UiLayout,
): {
  container: CSSProperties
  defaultLeftWidth: number
  minLeftWidth: number
  maxLeftWidth: number
} => {
  switch (mode) {
    case 'vertical':
      return {
        container: {
          width: '100%',
          height: '100vh',
        },
        defaultLeftWidth: 35,
        minLeftWidth: 20,
        maxLeftWidth: 60,
      }
    case 'narrow':
      return {
        container: {
          width: '100%',
          height: '100vh',
        },
        defaultLeftWidth: 40,
        minLeftWidth: 25,
        maxLeftWidth: 60,
      }
    case 'wide':
    default:
      return {
        container: {
          width: '100%',
          height: '100vh',
        },
        defaultLeftWidth: 25,
        minLeftWidth: 15,
        maxLeftWidth: 50,
      }
  }
}

/*
 * TODO: Revisit all these types (and redundancy across files).
 */

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

type PreCpmNode = {
  id: string
  type: 'cpmTask' | 'milestone'
  position: {
    x: number
    y: number
  }
  data: {
    label: string
    description: string
    cpm: {
      durationLow: number
      durationLikely: number
      durationHigh: number
    }
    successors: string[]
    sourcePosition: Position
    targetPosition: Position
  }
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
  data: ProjectParseResults,
  iframe: RefObject<HTMLIFrameElement | null>,
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
  const taskNodes: PreCpmNode[] = Object.values(data.project.tasks).map((t) => {
    return {
      id: `${t.type}:${t.name}`,
      type: 'cpmTask',
      position: { x: 0, y: 0 },
      data: {
        label: t.name,
        description: (t.attributes.description || 'No description').toString(),
        cpm: {
          durationLow: t.attributes.durationLow || 0,
          durationLikely: t.attributes.durationLikely || 0,
          durationHigh: t.attributes.durationHigh || 0,
        },
        successors: [],
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
      },
    }
  })
  const milestoneNodes: PreCpmNode[] = Object.values(
    data.project.milestones,
  ).map((m) => {
    return {
      id: `${m.type}:${m.name}`,
      type: 'milestone',
      position: { x: 0, y: 0 },
      data: {
        label: m.name,
        description: (m.attributes.description || 'No description').toString(),
        cpm: { durationLow: 0, durationLikely: 0, durationHigh: 0 },
        successors: [],
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
      },
    }
  })

  // TODO: Codify these tasks in to a singular type.
  const allNodes = [...taskNodes, ...milestoneNodes]

  void runCpm(nodesForCpm(edges, allNodes))
    .then((computed: CpmOutput | CpmError) => {
      if ('error' in computed) {
        console.error('CPM Error:', computed)
        return
      }
      // Create lookup maps for better runtime complexity.
      const cpmNodesMap: Record<string, CpmNode> = {}
      computed.tasks.forEach((cpmNode) => {
        cpmNodesMap[cpmNode.id] = cpmNode
      })

      const cpmArrowsMap: Record<string, CpmArrow> = {}
      computed.edges.forEach((arrow) => {
        cpmArrowsMap[arrow.id] = arrow
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
              duration: cpmNode.expectedDuration,
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
            criticalPath: cpmArrow.isCritical,
          },
        }
        if (e.data?.criticalPath) {
          e.style = { stroke: 'red', strokeWidth: 3, opacity: 0.5 }
          e.markerEnd = { type: MarkerType.ArrowClosed, color: 'red' }
        }
        return e
      })

      return doLayout<PreCpmNode>(
        [...updatedNodes, ...milestoneNodes],
        updatedEdges,
      )
    })
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    .then(([nodesPositioned, edgesPositioned]) => {
      if (!iframe.current?.contentWindow) {
        console.warn('No contentWindow in iframe, cannot post message')
        return
      }
      iframe.current.contentWindow.postMessage({
        nodes: JSON.stringify(nodesPositioned),
        edges: JSON.stringify(edgesPositioned),
      })
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

const nodesForCpm = (edges: Edge[], nodes: PreCpmNode[]): CpmInput[] => {
  const successorsMap: Record<string, string[]> = {}
  for (const e of edges) {
    const srcId = e.source
    const tgtId = e.target
    if (!successorsMap[srcId]) {
      successorsMap[srcId] = []
    }
    successorsMap[srcId].push(tgtId)
  }
  return nodes.map<CpmInput>((n) => {
    return {
      id: n.id,
      durationLow: n.data.cpm.durationLow,
      durationLikely: n.data.cpm.durationLikely,
      durationHigh: n.data.cpm.durationHigh,
      successors: successorsMap[n.id] || [],
    }
  })
}
