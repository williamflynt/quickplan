import { spawn } from 'node:child_process'
import path from 'node:path'
import type { CommandContext, CommandResult } from '../../core/types.js'
import { resolveWorkspace, type Workspace } from '../../core/workspace.js'

export type FormatResult = {
  package: string
  files: string[]
}

export type FormatData = {
  results: FormatResult[]
}

type FormatArgs = {
  package?: string
  check?: boolean
}

async function formatWorkspace(
  ctx: CommandContext,
  ws: Workspace,
  check: boolean,
): Promise<FormatResult | { ok: false; error: string }> {
  const npxPath = path.join(path.dirname(process.execPath), 'npx')
  const binDir = path.dirname(process.execPath)
  const env = { ...process.env, PATH: `${binDir}:${process.env.PATH}` }

  const relDir = path.relative(ctx.rootDir, ws.dir)
  const glob = `${relDir}/src/**/*.{ts,tsx}`
  const args = check
    ? ['prettier', '--check', '--list-different', glob]
    : ['prettier', '--write', glob]

  ctx.app.log('debug', `Running: npx ${args.join(' ')}`)

  return new Promise((resolve) => {
    const child = spawn(npxPath, args, {
      cwd: ctx.rootDir,
      env,
      stdio: ['pipe', 'pipe', 'pipe'],
    })

    const stdoutChunks: Buffer[] = []
    const stderrChunks: Buffer[] = []
    child.stdout.on('data', (chunk: Buffer) => stdoutChunks.push(chunk))
    child.stderr.on('data', (chunk: Buffer) => stderrChunks.push(chunk))

    child.on('close', (code) => {
      const stdout = Buffer.concat(stdoutChunks).toString('utf-8')
      const stderr = Buffer.concat(stderrChunks).toString('utf-8')

      // prettier --check exits 1 if files need formatting, that's not a crash
      if (code !== 0 && code !== 1) {
        resolve({
          ok: false,
          error: `prettier failed (exit ${code}): ${stderr}`,
        })
        return
      }

      const files = stdout
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line.length > 0)

      resolve({ package: ws.name, files })
    })

    child.on('error', (err) => {
      resolve({ ok: false, error: `Failed to spawn prettier: ${err.message}` })
    })
  })
}

export async function executeFormat(
  ctx: CommandContext,
  rawArgs: Record<string, unknown>,
): Promise<CommandResult<FormatData>> {
  const args = rawArgs as unknown as FormatArgs
  const check = args.check ?? false

  let workspaces: Workspace[]
  try {
    workspaces = resolveWorkspace(ctx.rootDir, args.package)
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    }
  }

  const results: FormatResult[] = []
  for (const ws of workspaces) {
    const result = await formatWorkspace(ctx, ws, check)
    if ('ok' in result && result.ok === false) {
      return { ok: false, error: result.error }
    }
    results.push(result as FormatResult)
  }

  return { ok: true, data: { results } }
}
