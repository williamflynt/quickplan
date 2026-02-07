import React, {
  FC,
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
  useLayoutEffect,
} from 'react'
import { executeExtended } from '@quickplan/project-flow-syntax/src/setupExtended'
import { configureMonacoWorkers, SAMPLE_CODE } from './config/editorConfig'
import { Monaco } from './components/Editor/Monaco'
import { ResizablePanels } from './components/ResizablePanels'
import { Toolbar } from './components/Toolbar'
import { ResourcePanel } from './components/ResourcePanel/ResourcePanel'
import { buildSchedule } from './services/resource/scheduleBuilder'
import { StorageService } from './services/storage'
import { openFile, saveAsFile } from './services/fileSystem'
import { useStore } from './store/store'
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts'
import { message } from 'antd'
import { updateFlowFromDocument } from './services/graph/documentUpdater'
import {
  calculateUiLayout,
  getUiLayoutStyles,
} from './services/layout/uiLayout'
import { UiLayout } from './types/layout'

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
    getCurrentProject,
    resourceInfoMap,
    projectAssignments,
    cpmResults,
    resourcePanelOpen,
    toggleResourcePanel,
    calendarConfig,
    dateAxis,
    scheduledRows: calendarScheduledRows,
  } = useStore()

  // Hydrate store from IndexedDB on mount.
  useLayoutEffect(() => {
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
  const handleProjectSwitch = useCallback(
    async (projectId: number) => {
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
    },
    [loadProject, getCurrentProject],
  )

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

    const newName = window.prompt(
      'Enter new project name:',
      currentProject.name,
    )
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
    const projectName = window.prompt(
      'Enter project name:',
      `Project ${new Date().toLocaleString()}`,
    )
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
      await saveAsFile(currentEditorContent, 'project.pfs')

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

        // Get the Monaco editor instance and expose it for devtools CDP access
        const editor = wrapper.getEditor?.()
        ;(window as any).__qpd_editor = editor

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
  }, [isHydrated])

  // Handle window resize for responsive layout.
  useEffect(() => {
    const handleResize = () => {
      setLayout(calculateUiLayout(window.innerWidth))
    }

    window.addEventListener('resize', handleResize)
    handleResize() // Set initial layout

    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  const scheduleRows = useMemo(
    () => buildSchedule(resourceInfoMap, projectAssignments, cpmResults),
    [resourceInfoMap, projectAssignments, cpmResults],
  )

  const maxTime = useMemo(() => {
    let max = 0
    for (const r of Object.values(cpmResults)) {
      if (r.earliestFinish > max) max = r.earliestFinish
    }
    // Resource-leveled tasks may extend beyond CPM max
    for (const row of scheduleRows) {
      for (const t of row.tasks) {
        if (t.finish > max) max = t.finish
      }
    }
    return max
  }, [cpmResults, scheduleRows])

  // When calendar config is present, compute calendar-aware maxTime from date axis
  const calendarMaxTime = useMemo(() => {
    if (!dateAxis || dateAxis.length === 0) return 0
    return dateAxis.length
  }, [dateAxis])

  const handleScheduleTaskClick = useCallback((taskId: string) => {
    if (!iframeRef.current?.contentWindow) return
    iframeRef.current.contentWindow.postMessage(
      { highlightNodeId: taskId },
      '*',
    )
  }, [])

  const handleScheduleTaskHover = useCallback((taskId: string | null) => {
    if (!iframeRef.current?.contentWindow) return
    iframeRef.current.contentWindow.postMessage({ hoverNodeId: taskId }, '*')
  }, [])

  const [activeResourceFilter, setActiveResourceFilter] = useState<
    string | null
  >(null)

  const handleResourceFilter = useCallback(
    (resourceName: string) => {
      const newFilter =
        activeResourceFilter === resourceName ? null : resourceName
      setActiveResourceFilter(newFilter)
      if (!iframeRef.current?.contentWindow) return
      iframeRef.current.contentWindow.postMessage(
        { filterResource: newFilter },
        '*',
      )
    },
    [activeResourceFilter],
  )

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

      <ResourcePanel
        open={resourcePanelOpen}
        scheduleRows={scheduleRows}
        maxTime={maxTime}
        onTaskClick={handleScheduleTaskClick}
        onTaskHover={handleScheduleTaskHover}
        onResourceClick={handleResourceFilter}
        activeResourceFilter={activeResourceFilter}
        onClose={toggleResourcePanel}
        calendarConfig={calendarConfig}
        dateAxis={dateAxis}
        scheduledRows={calendarScheduledRows}
        calendarMaxTime={calendarMaxTime}
        resourceInfoMap={resourceInfoMap}
      />

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
        onToggleResourcePanel={toggleResourcePanel}
        resourcePanelOpen={resourcePanelOpen}
      />
    </div>
  )
}
