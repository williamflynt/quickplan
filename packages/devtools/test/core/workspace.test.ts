import path from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  listWorkspaces,
  resolveWorkspace,
} from '../../src/core/workspace.js'

// Real monorepo root (two levels up from packages/devtools)
const rootDir = path.resolve(import.meta.dirname, '../../../..')

describe('listWorkspaces', () => {
  it('discovers all workspace packages', () => {
    const workspaces = listWorkspaces(rootDir)
    expect(workspaces.length).toBeGreaterThanOrEqual(3)
    const names = workspaces.map((ws) => ws.shortName)
    expect(names).toContain('web')
    expect(names).toContain('devtools')
    expect(names).toContain('project-flow-syntax')
  })

  it('returns absolute directory paths', () => {
    const workspaces = listWorkspaces(rootDir)
    for (const ws of workspaces) {
      expect(path.isAbsolute(ws.dir)).toBe(true)
    }
  })

  it('shortName is the last segment of the scoped name', () => {
    const workspaces = listWorkspaces(rootDir)
    const devtools = workspaces.find((ws) => ws.name === '@quickplan/devtools')
    expect(devtools).toBeDefined()
    expect(devtools!.shortName).toBe('devtools')
  })
})

describe('resolveWorkspace', () => {
  it('returns all workspaces when no name given', () => {
    const result = resolveWorkspace(rootDir)
    expect(result.length).toBeGreaterThanOrEqual(3)
  })

  it('resolves by shortName', () => {
    const result = resolveWorkspace(rootDir, 'web')
    expect(result).toHaveLength(1)
    expect(result[0].name).toBe('@quickplan/web')
  })

  it('resolves by full scoped name', () => {
    const result = resolveWorkspace(rootDir, '@quickplan/devtools')
    expect(result).toHaveLength(1)
    expect(result[0].shortName).toBe('devtools')
  })

  it('throws for unknown workspace', () => {
    expect(() => resolveWorkspace(rootDir, 'nonexistent')).toThrow(
      /Unknown workspace/,
    )
  })
})
