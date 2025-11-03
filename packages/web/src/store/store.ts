import create from 'zustand'
import { Edge, Node, ReactFlowInstance } from '@xyflow/react'
import { StorageService, ProjectDocument } from '../services/storage'

export type ProjectState = {
  id: number
  name: string
  content: string
  createdAt: number
  updatedAt: number
  lastSyncedAt?: number
  fileHandle?: FileSystemFileHandle
}

type RFState = {
  // ReactFlow state
  nodes: Node[]
  edges: Edge[]
  flowInstance: ReactFlowInstance | null
  activeChartId: string | null
  activeEdgeId: string | null
  activeNodeId: string | null
  nodeToolsVisible: boolean

  positionHold: boolean
  positionHoldCanReflow: boolean
  positionScaleX: number
  positionScaleY: number

  // Project management state
  projects: ProjectState[]
  currentProjectId: number | null
  currentEditorContent: string // Content being edited (may differ from saved project)
  isHydrated: boolean

  // UI state
  browserStatus: 'saved' | 'unsaved' | 'saving'
  diskStatus: 'saved' | 'unsaved' | 'saving'
  lastBrowserSave: number | null
  lastDiskSave: number | null

  // Actions
  hydrate: () => Promise<void>
  createProject: (name: string, content: string) => Promise<number>
  loadProject: (projectId: number) => Promise<void>
  deleteProject: (projectId: number) => Promise<void>
  renameProject: (projectId: number, name: string) => Promise<void>
  updateCurrentProject: (content: string) => void
  saveCurrentProject: () => Promise<void>
  downloadCurrentProject: () => Promise<void>
  clearAllProjects: () => Promise<void>
  clearGraph: () => void
  getCurrentProject: () => ProjectState | null
}

export const useStore = create<RFState>((set, get) => ({
  // ReactFlow state
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

  // Project management state
  projects: [],
  currentProjectId: null,
  currentEditorContent: '',
  isHydrated: false,

  // UI state
  browserStatus: 'saved',
  diskStatus: 'unsaved',
  lastBrowserSave: null,
  lastDiskSave: null,

  // Actions
  hydrate: async () => {
    const allProjects = await StorageService.getAllProjects()
    const projects: ProjectState[] = allProjects.map((p) => ({
      id: p.id!,
      name: p.name,
      content: p.content,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
      lastSyncedAt: p.lastSyncedAt,
      fileHandle: p.fileHandle,
    }))

    // Load most recent project if available, otherwise create a default project
    const mostRecent = projects[0]
    if (mostRecent) {
      set({
        projects,
        currentProjectId: mostRecent.id,
        currentEditorContent: mostRecent.content,
        browserStatus: 'saved',
        lastBrowserSave: mostRecent.updatedAt,
        diskStatus: mostRecent.lastSyncedAt ? 'saved' : 'unsaved',
        lastDiskSave: mostRecent.lastSyncedAt || null,
        isHydrated: true,
      })
      StorageService.setCurrentProjectId(mostRecent.id)
    } else {
      // No projects exist, create a default one with sample code
      const { SAMPLE_CODE } = await import('../../../project-flow-syntax/src/setupCommon')
      const projectId = await StorageService.saveProject(SAMPLE_CODE, 'Untitled Project')
      const newProject = await StorageService.getProject(projectId)
      
      if (newProject) {
        const defaultProject: ProjectState = {
          id: newProject.id!,
          name: newProject.name,
          content: newProject.content,
          createdAt: newProject.createdAt,
          updatedAt: newProject.updatedAt,
          lastSyncedAt: newProject.lastSyncedAt,
          fileHandle: newProject.fileHandle,
        }
        
        set({
          projects: [defaultProject],
          currentProjectId: projectId,
          currentEditorContent: SAMPLE_CODE,
          browserStatus: 'saved',
          lastBrowserSave: Date.now(),
          diskStatus: 'unsaved',
          lastDiskSave: null,
          isHydrated: true,
        })
        StorageService.setCurrentProjectId(projectId)
      } else {
        set({
          projects: [],
          isHydrated: true,
        })
      }
    }
  },

  createProject: async (name: string, content: string) => {
    const projectId = await StorageService.saveProject(content, name)
    const project = await StorageService.getProject(projectId)
    if (!project) throw new Error('Failed to create project')

    const newProject: ProjectState = {
      id: project.id!,
      name: project.name,
      content: project.content,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
      lastSyncedAt: project.lastSyncedAt,
      fileHandle: project.fileHandle,
    }

    set((state) => ({
      projects: [newProject, ...state.projects],
      currentProjectId: projectId,
      currentEditorContent: content,
      browserStatus: 'saved',
      lastBrowserSave: Date.now(),
      diskStatus: 'unsaved',
      lastDiskSave: null,
      nodes: [],
      edges: [],
    }))

    StorageService.setCurrentProjectId(projectId)
    return projectId
  },

  loadProject: async (projectId: number) => {
    const project = await StorageService.getProject(projectId)
    if (!project) throw new Error('Project not found')

    // Update project in list if it changed
    set((state) => {
      const projects = state.projects.map((p) =>
        p.id === projectId
          ? {
              id: project.id!,
              name: project.name,
              content: project.content,
              createdAt: project.createdAt,
              updatedAt: project.updatedAt,
              lastSyncedAt: project.lastSyncedAt,
              fileHandle: project.fileHandle,
            }
          : p
      )

      return {
        projects,
        currentProjectId: projectId,
        currentEditorContent: project.content,
        browserStatus: 'saved',
        lastBrowserSave: project.updatedAt,
        diskStatus: project.lastSyncedAt ? 'saved' : 'unsaved',
        lastDiskSave: project.lastSyncedAt || null,
        nodes: [],
        edges: [],
      }
    })

    StorageService.setCurrentProjectId(projectId)
  },

  deleteProject: async (projectId: number) => {
    await StorageService.deleteProject(projectId)
    set((state) => ({
      projects: state.projects.filter((p) => p.id !== projectId),
      currentProjectId:
        state.currentProjectId === projectId ? null : state.currentProjectId,
    }))
  },

  renameProject: async (projectId: number, name: string) => {
    await StorageService.renameProject(projectId, name)
    set((state) => ({
      projects: state.projects.map((p) =>
        p.id === projectId ? { ...p, name, updatedAt: Date.now() } : p
      ),
    }))
  },

  updateCurrentProject: (content: string) => {
    set({
      currentEditorContent: content,
      browserStatus: 'unsaved',
      diskStatus: 'unsaved',
    })
  },

  saveCurrentProject: async () => {
    const state = get()
    const { currentProjectId, currentEditorContent } = state
    
    // If no current project, create one first
    if (!currentProjectId) {
      const projectId = await StorageService.saveProject(currentEditorContent, 'Untitled Project')
      const newProject = await StorageService.getProject(projectId)
      
      if (newProject) {
        const project: ProjectState = {
          id: newProject.id!,
          name: newProject.name,
          content: newProject.content,
          createdAt: newProject.createdAt,
          updatedAt: newProject.updatedAt,
          lastSyncedAt: newProject.lastSyncedAt,
          fileHandle: newProject.fileHandle,
        }
        
        set((state) => ({
          projects: [project, ...state.projects],
          currentProjectId: projectId,
          browserStatus: 'saved',
          lastBrowserSave: Date.now(),
        }))
        StorageService.setCurrentProjectId(projectId)
      }
      return
    }
    
    // Save existing project
    set({ browserStatus: 'saving' })
    await StorageService.saveProject(
      currentEditorContent,
      undefined,
      currentProjectId
    )
    
    // Update project in list
    set((state) => ({
      projects: state.projects.map((p) =>
        p.id === currentProjectId
          ? { ...p, content: currentEditorContent, updatedAt: Date.now() }
          : p
      ),
      browserStatus: 'saved',
      lastBrowserSave: Date.now(),
    }))
  },

  downloadCurrentProject: async () => {
    const state = get()
    if (!state.currentProjectId) return

    set({ diskStatus: 'saving' })
    await StorageService.updateLastSynced(state.currentProjectId)
    
    // Update the project's lastSyncedAt in the list
    set((state) => ({
      projects: state.projects.map((p) =>
        p.id === state.currentProjectId
          ? { ...p, lastSyncedAt: Date.now() }
          : p
      ),
      diskStatus: 'saved',
      lastDiskSave: Date.now(),
    }))
  },

  clearAllProjects: async () => {
    const allProjects = await StorageService.getAllProjects()
    for (const project of allProjects) {
      if (project.id) {
        await StorageService.deleteProject(project.id)
      }
    }

    set({
      projects: [],
      currentProjectId: null,
      currentEditorContent: '',
      browserStatus: 'saved',
      diskStatus: 'unsaved',
      lastBrowserSave: null,
      lastDiskSave: null,
      nodes: [],
      edges: [],
    })
  },

  clearGraph: () => {
    set({
      nodes: [],
      edges: [],
    })
  },

  getCurrentProject: () => {
    const state = get()
    return state.projects.find((p) => p.id === state.currentProjectId) || null
  },
}))
