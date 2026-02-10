import { spawn as cpSpawn, execFileSync } from 'node:child_process'
import {
  existsSync,
  readFileSync,
  writeFileSync,
  mkdirSync,
  unlinkSync,
  openSync,
  closeSync,
  createReadStream,
} from 'node:fs'
import { createInterface } from 'node:readline'
import path from 'node:path'
import type {
  CommandContext,
  CommandGroup,
  CommandPlan,
  CommandResult,
} from '../../core/types.js'
import { ProcessManager } from '../../core/process-manager.js'
import { executeLint } from './lint.js'
import { executeFormat } from './format.js'
import { executeBuild } from './build.js'
import { executeTest } from './test.js'
import { fileURLToPath } from 'node:url'

type DevState = {
  vitePid?: number
  chromiumPid?: number
  port: number
  cdpPort?: number
  logFile?: string
  startedAt: number
}

type StartArgs = {
  noBrowser?: boolean
  port?: string
  background?: boolean
  logDir?: string
}

type LogsArgs = {
  follow?: boolean
  lines?: string
}

function stateFilePath(dataDir: string): string {
  return path.join(dataDir, 'dev.json')
}

function readState(dataDir: string): DevState | undefined {
  const fp = stateFilePath(dataDir)
  if (!existsSync(fp)) return undefined
  try {
    return JSON.parse(readFileSync(fp, 'utf-8'))
  } catch {
    return undefined
  }
}

function writeState(dataDir: string, state: DevState): void {
  mkdirSync(dataDir, { recursive: true })
  writeFileSync(stateFilePath(dataDir), JSON.stringify(state, null, 2))
}

function removeState(dataDir: string): void {
  const fp = stateFilePath(dataDir)
  if (existsSync(fp)) unlinkSync(fp)
}

function isProcessAlive(pid: number): boolean {
  try {
    process.kill(pid, 0)
    return true
  } catch {
    return false
  }
}

function isSessionAlive(pid: number): boolean {
  try {
    process.kill(-pid, 0)
    return true
  } catch {
    return isProcessAlive(pid)
  }
}

async function killSession(pid: number): Promise<void> {
  const send = (sig: NodeJS.Signals) => {
    try {
      process.kill(-pid, sig)
    } catch {
      /* group gone */
    }
    try {
      process.kill(pid, sig)
    } catch {
      /* process gone */
    }
  }
  send('SIGTERM')
  const deadline = Date.now() + 2000
  while (Date.now() < deadline) {
    if (!isSessionAlive(pid)) return
    await new Promise((r) => setTimeout(r, 100))
  }
  send('SIGKILL')
}

function resolveNpm(): string {
  return path.join(path.dirname(process.execPath), 'npm')
}

function resolveChromium(): string | undefined {
  // Check for flatpak first
  try {
    execFileSync('flatpak', ['info', 'org.chromium.Chromium'], {
      stdio: 'pipe',
    })
    return 'flatpak'
  } catch {
    // not available
  }

  const candidates = [
    '/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
    '/snap/bin/chromium',
  ]
  for (const c of candidates) {
    if (existsSync(c)) return c
  }
  return undefined
}

async function executeStart(
  ctx: CommandContext,
  rawArgs: Record<string, unknown>,
): Promise<CommandResult> {
  const args = rawArgs as unknown as StartArgs
  const port = parseInt(args.port ?? '5173', 10)
  const logDir = args.logDir ?? path.join(ctx.dataDir, 'logs')

  // Non-interactive contexts (MCP) must not block on foreground mode
  if (ctx.options.nonInteractive) {
    args.background = true
  }

  const pm = new ProcessManager(ctx.app)
  const npmPath = resolveNpm()
  const binDir = path.dirname(process.execPath)
  const env = { ...process.env, PATH: `${binDir}:${process.env.PATH}` }

  // Check if already running
  const existing = readState(ctx.dataDir)
  if (existing && existing.vitePid && isSessionAlive(existing.vitePid)) {
    // Vite is alive — but if chromium is dead and user wants a browser, relaunch it
    const chromiumAlive = existing.chromiumPid
      ? isProcessAlive(existing.chromiumPid)
      : false
    if (!args.noBrowser && !chromiumAlive) {
      const chromiumPath = resolveChromium()
      if (chromiumPath) {
        const cdpPort = 9222
        const chromiumArgs =
          chromiumPath === 'flatpak'
            ? [
                'run',
                'org.chromium.Chromium',
                `--remote-debugging-port=${cdpPort}`,
                `--user-data-dir=/tmp/qpd-chrome-${Date.now()}`,
                `http://localhost:${existing.port}`,
              ]
            : [
                `--remote-debugging-port=${cdpPort}`,
                `--user-data-dir=/tmp/qpd-chrome-${Date.now()}`,
                `http://localhost:${existing.port}`,
              ]

        const chromiumCmd =
          chromiumPath === 'flatpak' ? 'flatpak' : chromiumPath
        const browserChild = cpSpawn(chromiumCmd, chromiumArgs, {
          cwd: ctx.rootDir,
          env,
          stdio: 'ignore',
          detached: true,
        })
        browserChild.unref()

        existing.chromiumPid = browserChild.pid
        existing.cdpPort = cdpPort
        writeState(ctx.dataDir, existing)

        return {
          ok: true,
          data: {
            message: 'Vite already running. Relaunched browser.',
            viteUrl: `http://localhost:${existing.port}`,
            vitePid: existing.vitePid,
            chromiumPid: existing.chromiumPid,
            cdpPort,
          },
        }
      }
    }

    return {
      ok: false,
      error: `Dev server already running (vite pid: ${existing.vitePid}). Use \`qpd dev stop\` first.`,
    }
  }

  // Background mode: redirect output to log files
  if (args.background) {
    mkdirSync(logDir, { recursive: true })
    const logFile = path.join(logDir, `dev-${Date.now()}.log`)
    const logFd = openSync(logFile, 'a')

    const viteChild = cpSpawn(
      npmPath,
      [
        'run',
        'dev',
        '--workspace=@quickplan/web',
        '--',
        '--port',
        String(port),
      ],
      {
        cwd: ctx.rootDir,
        env,
        stdio: ['ignore', logFd, logFd],
        detached: true,
      },
    )
    viteChild.unref()

    const state: DevState = {
      vitePid: viteChild.pid,
      port,
      logFile,
      startedAt: Date.now(),
    }

    if (!args.noBrowser) {
      const chromiumPath = resolveChromium()
      if (chromiumPath) {
        const chromiumArgs =
          chromiumPath === 'flatpak'
            ? [
                'run',
                'org.chromium.Chromium',
                '--remote-debugging-port=9222',
                `--user-data-dir=/tmp/qpd-chrome-${Date.now()}`,
                `http://localhost:${port}`,
              ]
            : [
                '--remote-debugging-port=9222',
                `--user-data-dir=/tmp/qpd-chrome-${Date.now()}`,
                `http://localhost:${port}`,
              ]

        const chromiumCmd =
          chromiumPath === 'flatpak' ? 'flatpak' : chromiumPath
        const browserChild = cpSpawn(chromiumCmd, chromiumArgs, {
          cwd: ctx.rootDir,
          env,
          stdio: ['ignore', logFd, logFd],
          detached: true,
        })
        browserChild.unref()
        state.chromiumPid = browserChild.pid
        state.cdpPort = 9222
      }
    }

    closeSync(logFd)
    writeState(ctx.dataDir, state)
    return {
      ok: true,
      data: {
        viteUrl: `http://localhost:${port}`,
        vitePid: state.vitePid,
        chromiumPid: state.chromiumPid,
        cdpPort: state.cdpPort,
        backgrounded: true,
        logFile,
      },
    }
  }

  // Foreground mode
  ctx.app.log('info', `Starting Vite dev server on port ${port}...`)

  pm.spawn(
    'vite',
    npmPath,
    ['run', 'dev', '--workspace=@quickplan/web', '--', '--port', String(port)],
    { cwd: ctx.rootDir, env },
  )

  try {
    await pm.waitForOutput('vite', /localhost:\d+/, 30_000)
  } catch {
    ctx.app.log(
      'warn',
      'Timed out waiting for Vite ready signal, continuing...',
    )
  }

  const state: DevState = {
    vitePid: pm.get('vite')?.pid,
    port,
    startedAt: Date.now(),
  }

  if (!args.noBrowser) {
    const chromiumPath = resolveChromium()
    if (chromiumPath) {
      const cdpPort = 9222
      const chromiumArgs =
        chromiumPath === 'flatpak'
          ? [
              'run',
              'org.chromium.Chromium',
              `--remote-debugging-port=${cdpPort}`,
              `--user-data-dir=/tmp/qpd-chrome-${Date.now()}`,
              `http://localhost:${port}`,
            ]
          : [
              `--remote-debugging-port=${cdpPort}`,
              `--user-data-dir=/tmp/qpd-chrome-${Date.now()}`,
              `http://localhost:${port}`,
            ]

      const chromiumCmd = chromiumPath === 'flatpak' ? 'flatpak' : chromiumPath
      pm.spawn('chromium', chromiumCmd, chromiumArgs, { cwd: ctx.rootDir, env })
      state.chromiumPid = pm.get('chromium')?.pid
      state.cdpPort = cdpPort
    } else {
      ctx.app.log(
        'warn',
        'Chromium not found. Use `qpd doctor` to check. Starting without browser.',
      )
    }
  }

  writeState(ctx.dataDir, state)

  // Wait for vite to exit (blocks foreground)
  await pm.waitForExit('vite')
  removeState(ctx.dataDir)

  return {
    ok: true,
    data: {
      viteUrl: `http://localhost:${port}`,
      vitePid: state.vitePid,
      chromiumPid: state.chromiumPid,
      cdpPort: state.cdpPort,
      backgrounded: false,
    },
  }
}

async function executeStop(ctx: CommandContext): Promise<CommandResult> {
  const state = readState(ctx.dataDir)
  if (!state) {
    return { ok: false, error: 'No running dev session found.' }
  }

  const killed: string[] = []

  if (state.vitePid && isSessionAlive(state.vitePid)) {
    await killSession(state.vitePid)
    killed.push(`vite (pid ${state.vitePid})`)
  }

  if (state.chromiumPid && isProcessAlive(state.chromiumPid)) {
    await killSession(state.chromiumPid)
    killed.push(`chromium (pid ${state.chromiumPid})`)
  }

  removeState(ctx.dataDir)

  if (killed.length === 0) {
    return {
      ok: true,
      data: { message: 'No processes were running. Cleaned up state file.' },
    }
  }

  return { ok: true, data: { message: `Stopped: ${killed.join(', ')}` } }
}

async function executeStatus(ctx: CommandContext): Promise<CommandResult> {
  const state = readState(ctx.dataDir)
  if (!state) {
    return { ok: true, data: { running: false, message: 'No dev session.' } }
  }

  const viteAlive = state.vitePid ? isSessionAlive(state.vitePid) : false
  const chromiumAlive = state.chromiumPid
    ? isProcessAlive(state.chromiumPid)
    : false

  return {
    ok: true,
    data: {
      running: viteAlive || chromiumAlive,
      vite: { pid: state.vitePid, alive: viteAlive },
      chromium: state.chromiumPid
        ? { pid: state.chromiumPid, alive: chromiumAlive }
        : undefined,
      port: state.port,
      cdpPort: state.cdpPort,
      logFile: state.logFile,
      startedAt: state.startedAt,
    },
  }
}

async function executeLogs(
  ctx: CommandContext,
  rawArgs: Record<string, unknown>,
): Promise<CommandResult> {
  const args = rawArgs as unknown as LogsArgs
  const state = readState(ctx.dataDir)

  if (!state?.logFile) {
    return {
      ok: false,
      error: 'No log file found. Is the dev server running in background mode?',
    }
  }

  if (!existsSync(state.logFile)) {
    return { ok: false, error: `Log file not found: ${state.logFile}` }
  }

  const lines = parseInt(args.lines ?? '50', 10)
  const follow = ctx.options.nonInteractive ? false : args.follow !== false

  // Read the last N lines
  const content = readFileSync(state.logFile, 'utf-8')
  const allLines = content.split('\n')
  const tail = allLines.slice(-lines).join('\n')

  if (!follow) {
    return { ok: true, data: { logFile: state.logFile, output: tail } }
  }

  // Follow mode — stream new lines
  process.stdout.write(tail + '\n')

  return new Promise((resolve) => {
    const rl = createInterface({
      input: createReadStream(state.logFile!, {
        start: Buffer.byteLength(content),
        encoding: 'utf-8',
      }),
    })

    rl.on('line', (line) => {
      process.stdout.write(line + '\n')
    })

    const shutdown = () => {
      rl.close()
      resolve({ ok: true, data: { logFile: state.logFile } })
    }

    process.on('SIGINT', shutdown)
    process.on('SIGTERM', shutdown)
  })
}

async function executeBuildInstall(
  ctx: CommandContext,
): Promise<CommandResult> {
  const scriptDir = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    '..',
    '..',
    '..',
    'bin',
  )
  const scriptPath = path.join(scriptDir, 'build-install.js')

  return new Promise((resolve) => {
    const child = cpSpawn(process.execPath, [scriptPath], {
      cwd: path.resolve(scriptDir, '..'),
      stdio: ['ignore', 'pipe', 'pipe'],
    })

    const stdoutChunks: Buffer[] = []
    const stderrChunks: Buffer[] = []
    child.stdout.on('data', (chunk: Buffer) => stdoutChunks.push(chunk))
    child.stderr.on('data', (chunk: Buffer) => stderrChunks.push(chunk))

    child.on('close', (code) => {
      const stdout = Buffer.concat(stdoutChunks).toString('utf-8')
      const stderr = Buffer.concat(stderrChunks).toString('utf-8')
      const output = (stdout + stderr).trim()

      if (code !== 0) {
        resolve({
          ok: false,
          error: `build-install failed (exit ${code})`,
          details: output,
        })
      } else {
        resolve({ ok: true, data: { output } })
      }
    })

    child.on('error', (err) => {
      resolve({
        ok: false,
        error: `Failed to spawn build-install: ${err.message}`,
      })
    })
  })
}

async function planStart(
  _ctx: CommandContext,
  rawArgs: Record<string, unknown>,
): Promise<CommandPlan> {
  const args = rawArgs as unknown as StartArgs
  const steps = [
    {
      id: 'start-vite',
      description: `Start Vite dev server on port ${args.port ?? 5173}`,
      dependsOn: [] as string[],
    },
  ]

  if (!args.noBrowser) {
    steps.push({
      id: 'start-chromium',
      description: 'Launch Chromium with CDP debugging enabled',
      dependsOn: ['start-vite'],
    })
  }

  return { steps }
}

export const devGroup: CommandGroup = {
  name: 'dev',
  description: 'Manage the development server',
  commands: [
    {
      name: 'start',
      description:
        'Start the Vite dev server and optionally Chromium. Use --background for non-interactive contexts.',
      options: [
        {
          flags: '--no-browser',
          description: 'Start Vite only, without launching Chromium',
        },
        {
          flags: '-p, --port <port>',
          description: 'Port for Vite dev server',
          defaultValue: '5173',
        },
        {
          flags: '-b, --background',
          description: 'Run in background (detach processes)',
        },
        {
          flags: '--log-dir <dir>',
          description: 'Directory for background log files',
        },
      ],
      execute: executeStart,
      plan: planStart,
    },
    {
      name: 'stop',
      description: 'Stop the running dev session',
      execute: executeStop,
    },
    {
      name: 'status',
      description: 'Check the status of the dev session',
      execute: executeStatus,
    },
    {
      name: 'logs',
      description: 'View logs from a background dev session',
      options: [
        {
          flags: '-f, --follow',
          description: 'Follow log output (default: true)',
          defaultValue: true,
        },
        {
          flags: '-n, --lines <count>',
          description: 'Number of lines to show',
          defaultValue: '50',
        },
      ],
      execute: executeLogs,
    },
    {
      name: 'lint',
      description: 'Lint workspace packages with eslint',
      args: ['[package]'],
      options: [
        {
          flags: '--fix',
          description: 'Auto-fix lint issues (includes prettier formatting)',
        },
      ],
      execute: executeLint,
    },
    {
      name: 'format',
      description: 'Format workspace packages with prettier',
      args: ['[package]'],
      options: [
        {
          flags: '--check',
          description: 'Check formatting without writing changes',
        },
      ],
      execute: executeFormat,
    },
    {
      name: 'build',
      description: 'Build workspace packages with tsc',
      args: ['[package]'],
      execute: executeBuild,
    },
    {
      name: 'test',
      description: 'Run tests in workspace packages with vitest',
      args: ['[package]'],
      execute: executeTest,
    },
    {
      name: 'build-install',
      description: 'Compile devtools and npm-link qpd, then configure MCP',
      execute: executeBuildInstall,
    },
  ],
}
