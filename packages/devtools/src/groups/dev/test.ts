import { spawn } from 'node:child_process'
import path from 'node:path'
import type { CommandContext, CommandResult } from '../../core/types.js'
import { resolveWorkspace, type Workspace } from '../../core/workspace.js'

export type TestResult = {
  package: string
  success: boolean
  output: string
}

export type TestData = {
  results: TestResult[]
}

type TestArgs = {
  package?: string
}

async function testWorkspace(
  ctx: CommandContext,
  ws: Workspace,
): Promise<TestResult | { ok: false; error: string }> {
  const npxPath = path.join(path.dirname(process.execPath), 'npx')
  const binDir = path.dirname(process.execPath)
  const env = { ...process.env, PATH: `${binDir}:${process.env.PATH}` }

  const args = ['vitest', 'run']

  ctx.app.log('debug', `Running: npx ${args.join(' ')} in ${ws.dir}`)

  return new Promise((resolve) => {
    const child = spawn(npxPath, args, {
      cwd: ws.dir,
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
      const output = (stdout + stderr).trim()

      resolve({
        package: ws.name,
        success: code === 0,
        output,
      })
    })

    child.on('error', (err) => {
      resolve({ ok: false, error: `Failed to spawn vitest: ${err.message}` })
    })
  })
}

export async function executeTest(
  ctx: CommandContext,
  rawArgs: Record<string, unknown>,
): Promise<CommandResult<TestData>> {
  const args = rawArgs as unknown as TestArgs

  let workspaces: Workspace[]
  try {
    workspaces = resolveWorkspace(ctx.rootDir, args.package)
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    }
  }

  const results: TestResult[] = []
  for (const ws of workspaces) {
    const result = await testWorkspace(ctx, ws)
    if ('ok' in result && result.ok === false) {
      return { ok: false, error: result.error }
    }
    results.push(result as TestResult)
  }

  return { ok: true, data: { results } }
}
