import { readFileSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'

export type Workspace = {
  name: string
  shortName: string
  dir: string
}

export function listWorkspaces(rootDir: string): Workspace[] {
  const rootPkg = JSON.parse(
    readFileSync(path.join(rootDir, 'package.json'), 'utf-8'),
  )
  const globs: string[] = rootPkg.workspaces ?? []
  const workspaces: Workspace[] = []

  for (const pattern of globs) {
    // Support simple "packages/*" style globs
    const starIdx = pattern.indexOf('*')
    if (starIdx === -1) continue
    const baseDir = path.join(rootDir, pattern.slice(0, starIdx))

    let entries: string[]
    try {
      entries = readdirSync(baseDir)
    } catch {
      continue
    }

    for (const entry of entries) {
      const pkgDir = path.join(baseDir, entry)
      const pkgJsonPath = path.join(pkgDir, 'package.json')
      try {
        if (!statSync(pkgDir).isDirectory()) continue
        const pkg = JSON.parse(readFileSync(pkgJsonPath, 'utf-8'))
        const name: string = pkg.name
        if (!name) continue
        const shortName = name.includes('/') ? name.split('/').pop()! : name
        workspaces.push({ name, shortName, dir: pkgDir })
      } catch {
        continue
      }
    }
  }

  return workspaces
}

export function resolveWorkspace(
  rootDir: string,
  nameOrAll?: string,
): Workspace[] {
  const all = listWorkspaces(rootDir)
  if (!nameOrAll) return all

  const match = all.find(
    (ws) => ws.shortName === nameOrAll || ws.name === nameOrAll,
  )
  if (!match) {
    const available = all.map((ws) => ws.shortName).join(', ')
    throw new Error(
      `Unknown workspace "${nameOrAll}". Available: ${available}`,
    )
  }
  return [match]
}
