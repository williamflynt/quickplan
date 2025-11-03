import React, {
  CSSProperties,
  FC,
  RefObject,
  useEffect,
  useRef,
  useState,
  useCallback,
} from 'react'
import { executeExtended } from '@quickplan/project-flow-syntax/src/setupExtended'
import { configureMonacoWorkers, SAMPLE_CODE } from '@quickplan/project-flow-syntax/src/setupCommon'
import { Monaco } from './components/Editor/Monaco'
import { ResizablePanels } from './components/ResizablePanels'
import { Toolbar } from './components/Toolbar'
import { MarkerType, Position } from '@xyflow/react'
import ELK, { ElkNode, LayoutOptions } from 'elkjs/lib/elk.bundled.js'
import { runCpm } from './cpm/cpm'
import { StorageService } from './services/storage'
import { openFile, saveAsFile, saveFile } from './services/fileSystem'
import { useStore } from './store/store'
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts'
import { message } from 'antd'
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

  // Get all state and actions from Zustand store
  const {
    projects,
    currentProjectId,
    currentEditorContent,
    browserStatus,
    diskStatus,
    lastBrowserSave,
    lastDiskSave,
    isHydrated,
    hydrate,
    createProject,
    loadProject,
    renameProject,
    updateCurrentProject,
    saveCurrentProject,
    downloadCurrentProject,
    clearAllProjects,
    clearGraph,
    getCurrentProject,
  } = useStore()

  // Hydrate store from IndexedDB on mount
  useEffect(() => {
    hydrate()
  }, [])

  // Handle opening a file from disk
  const handleOpen = useCallback(async () => {
    const result = await openFile()
    if (!result) return

    try {
      const projectId = await createProject(result.name, result.content)
      await StorageService.updateLastSynced(projectId)
      
      if (wrapperRef.current) {
        const editor = wrapperRef.current.getEditor?.()
        if (editor && editor.setValue) {
          editor.setValue(result.content)
        }
      }

      message.success(`Opened ${result.name}`)
    } catch (error) {
      console.error('Error opening file:', error)
      message.error('Failed to open file')
    }
  }, [createProject])

  // Handle resetting/clearing local storage
  const handleReset = useCallback(async () => {
    const confirmed = window.confirm(
      'This will clear all saved projects from browser storage. This cannot be undone. Continue?',
    )

    if (!confirmed) return

    try {
      await clearAllProjects()
      
      // Reset Monaco editor to sample code
      if (wrapperRef.current) {
        const editor = wrapperRef.current.getEditor?.()
        if (editor && editor.setValue) {
          editor.setValue(SAMPLE_CODE)
        }
      }

      message.success('Browser storage cleared')
    } catch (error) {
      console.error('Error clearing storage:', error)
      message.error('Failed to clear storage')
    }
  }, [clearAllProjects])

  // Handle switching to a different project
  const handleProjectSwitch = useCallback(async (projectId: number) => {
    try {
      await loadProject(projectId)
      const project = getCurrentProject()
      if (!project) {
        message.error('Project not found')
        return
      }

      // Update Monaco editor
      if (wrapperRef.current) {
        const editor = wrapperRef.current.getEditor?.()
        if (editor && editor.setValue) {
          editor.setValue(project.content)
        }
      }

      message.success(`Switched to ${project.name}`)
    } catch (error) {
      console.error('Error switching project:', error)
      message.error('Failed to switch project')
    }
  }, [loadProject, getCurrentProject])

  // Handle renaming the current project
  const handleProjectRename = useCallback(async () => {
    if (!currentProjectId) {
      message.warning('No project selected')
      return
    }

    const currentProject = getCurrentProject()
    if (!currentProject) {
      message.error('Project not found')
      return
    }

    const newName = window.prompt('Enter new project name:', currentProject.name)
    if (!newName || newName.trim() === '') {
      return
    }

    try {
      await renameProject(currentProjectId, newName.trim())
      message.success(`Renamed to "${newName.trim()}"`)
    } catch (error) {
      console.error('Error renaming project:', error)
      message.error('Failed to rename project')
    }
  }, [currentProjectId, getCurrentProject, renameProject])

  // Handle creating a new project
  const handleNew = useCallback(async () => {
    const projectName = window.prompt('Enter project name:', `Project ${new Date().toLocaleString()}`)
    if (!projectName || projectName.trim() === '') {
      return
    }

    try {
      await createProject(projectName.trim(), SAMPLE_CODE)
      
      // Update Monaco editor
      if (wrapperRef.current) {
        const editor = wrapperRef.current.getEditor?.()
        if (editor && editor.setValue) {
          editor.setValue(SAMPLE_CODE)
        }
      }

      message.success(`Created "${projectName.trim()}"`)
    } catch (error) {
      console.error('Error creating project:', error)
      message.error('Failed to create project')
    }
  }, [createProject])
  
  const handleDownload = useCallback(async () => {
    if (!currentEditorContent) {
      message.warning('No content to download')
      return
    }

    try {
      // Download the file
      const handle = await saveAsFile(currentEditorContent, 'project.pfs')
      
      // Update disk sync status
      if (currentProjectId) {
        await StorageService.updateLastSynced(currentProjectId)
        await downloadCurrentProject()
      }
      
      message.success('File downloaded')
    } catch (error) {
      console.error('Error downloading:', error)
      message.error('Failed to download file')
    }
  }, [currentEditorContent, currentProjectId, downloadCurrentProject])

  // Keyboard shortcuts
  useKeyboardShortcuts([
    {
      key: 'n',
      ctrlOrCmd: true,
      shift: false,
      handler: () => handleNew(),
      description: 'New project',
    },
    {
      key: 's',
      ctrlOrCmd: true,
      shift: false,
      handler: () => handleDownload(),
      description: 'Download file',
    },
    {
      key: 'o',
      ctrlOrCmd: true,
      shift: false,
      handler: () => handleOpen(),
      description: 'Open file',
    },
  ])

  // Initialize Monaco editor and language client.
  useEffect(() => {
    // Wait for store to be hydrated
    if (!isHydrated) return
    if (!editorRef.current) return
    if (wrapperRef.current) return // Already initialized

    const initialContent = currentEditorContent || SAMPLE_CODE

    configureMonacoWorkers()
    void executeExtended(editorRef.current).then(
      ({ wrapper, languageClient }) => {
        wrapperRef.current = wrapper
        languageClientRef.current = languageClient

        // Get the Monaco editor instance
        const editor = wrapper.getEditor?.()

        // Set the loaded content (overrides SAMPLE_CODE in setupExtended)
        if (editor && editor.setValue) {
          editor.setValue(initialContent)
        }

        // Listen for content changes
        if (editor && editor.onDidChangeModelContent) {
          editor.onDidChangeModelContent(() => {
            const content = editor.getValue?.()
            if (content !== undefined) {
              updateCurrentProject(content)
              // Schedule auto-save to IndexedDB
              StorageService.scheduleAutoSave(content, () => {
                saveCurrentProject()
              })
            }
          })
        }

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
      // Cleanup Monaco editor
      if (wrapperRef.current) {
        try {
          wrapperRef.current.dispose?.()
        } catch (error) {
          console.error('Error disposing Monaco wrapper:', error)
        }
        wrapperRef.current = null
        languageClientRef.current = null
      }
    }
  }, [isHydrated, currentEditorContent, updateCurrentProject, saveCurrentProject])

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
      <Monaco editorRef={editorRef} style={{ width: '100%', height: '100%' }} />
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
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          flex: 1,
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

      <Toolbar
        browserStatus={browserStatus}
        diskStatus={diskStatus}
        lastBrowserSave={lastBrowserSave}
        lastDiskSave={lastDiskSave}
        projects={projects}
        currentProjectId={currentProjectId}
        onNew={handleNew}
        onOpen={handleOpen}
        onDownload={handleDownload}
        onReset={handleReset}
        onProjectSwitch={handleProjectSwitch}
        onProjectRename={handleProjectRename}
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

      return doLayout<PreCpmNode>(updatedNodes, updatedEdges)
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
