import Dexie, { Table } from 'dexie'

export interface ProjectDocument {
  id?: number
  name: string
  content: string // PFS source code
  createdAt: number
  updatedAt: number
  lastSyncedAt?: number // Last time saved to file system
  fileHandle?: FileSystemFileHandle // For File System Access API
}

class QuickPlanDatabase extends Dexie {
  projects!: Table<ProjectDocument>

  constructor() {
    super('QuickPlanDB')
    this.version(1).stores({
      projects: '++id, name, updatedAt',
    })
  }
}

export const db = new QuickPlanDatabase()

// Storage service
export class StorageService {
  private static currentProjectId: number | null = null
  private static autoSaveTimer: NodeJS.Timeout | null = null
  private static AUTO_SAVE_DELAY = 2000 // 2 seconds after last edit

  /**
   * Get the current project ID
   */
  static getCurrentProjectId(): number | null {
    return this.currentProjectId
  }

  /**
   * Set the current project ID
   */
  static setCurrentProjectId(id: number | null): void {
    this.currentProjectId = id
  }

  /**
   * Create or update a project in IndexedDB
   */
  static async saveProject(
    content: string,
    name?: string,
    id?: number,
  ): Promise<number> {
    const now = Date.now()

    if (id !== undefined) {
      // Update existing project
      await db.projects.update(id, {
        content,
        updatedAt: now,
        ...(name && { name }),
      })
      return id
    } else {
      // Create new project
      const projectId = await db.projects.add({
        name: name || `Project ${new Date().toLocaleString()}`,
        content,
        createdAt: now,
        updatedAt: now,
      })
      this.currentProjectId = projectId
      return projectId
    }
  }

  /**
   * Auto-save with debouncing
   */
  static scheduleAutoSave(content: string, onSaveComplete?: () => void): void {
    if (this.autoSaveTimer) {
      clearTimeout(this.autoSaveTimer)
    }

    this.autoSaveTimer = setTimeout(async () => {
      try {
        if (this.currentProjectId !== null) {
          await this.saveProject(content, undefined, this.currentProjectId)
        } else {
          // First auto-save, create new project
          await this.saveProject(content, 'Untitled Project')
        }
        // Notify that auto-save completed
        if (onSaveComplete) {
          onSaveComplete()
        }
      } catch (error) {
        console.error('Auto-save failed:', error)
      }
    }, this.AUTO_SAVE_DELAY)
  }

  /**
   * Get a project by ID
   */
  static async getProject(id: number): Promise<ProjectDocument | undefined> {
    return await db.projects.get(id)
  }

  /**
   * Get all projects
   */
  static async getAllProjects(): Promise<ProjectDocument[]> {
    return await db.projects.orderBy('updatedAt').reverse().toArray()
  }

  /**
   * Delete a project
   */
  static async deleteProject(id: number): Promise<void> {
    await db.projects.delete(id)
    if (this.currentProjectId === id) {
      this.currentProjectId = null
    }
  }

  /**
   * Load the most recently updated project
   */
  static async loadMostRecent(): Promise<ProjectDocument | undefined> {
    const projects = await db.projects
      .orderBy('updatedAt')
      .reverse()
      .limit(1)
      .toArray()
    if (projects.length > 0) {
      this.currentProjectId = projects[0].id!
      return projects[0]
    }
    return undefined
  }

  /**
   * Update last synced timestamp
   */
  static async updateLastSynced(id: number): Promise<void> {
    await db.projects.update(id, {
      lastSyncedAt: Date.now(),
    })
  }

  /**
   * Rename a project
   */
  static async renameProject(id: number, name: string): Promise<void> {
    await db.projects.update(id, { name })
  }

  /**
   * Check if project has unsaved changes
   */
  static async hasUnsavedChanges(id: number): Promise<boolean> {
    const project = await db.projects.get(id)
    if (!project) return false
    return (
      project.lastSyncedAt === undefined ||
      project.updatedAt > project.lastSyncedAt
    )
  }
}
