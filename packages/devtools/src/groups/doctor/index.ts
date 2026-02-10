import { execFile } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import type {
  CommandContext,
  CommandGroup,
  CommandPlan,
  CommandResult,
} from '../../core/types.js'

export type DoctorCheck = {
  name: string
  status: 'ok' | 'warn' | 'missing'
  detail: string
  version?: string
  path?: string
}

type DoctorResult = {
  checks: DoctorCheck[]
  summary: { ok: number; warn: number; missing: number }
}

function spawnVersion(
  command: string,
  args: string[],
): Promise<{ stdout: string; exitCode: number }> {
  return new Promise((resolve) => {
    execFile(command, args, { timeout: 5000 }, (err, stdout) => {
      if (err) {
        resolve({ stdout: '', exitCode: 1 })
      } else {
        resolve({ stdout: stdout.trim(), exitCode: 0 })
      }
    })
  })
}

async function checkNode(): Promise<DoctorCheck> {
  return {
    name: 'Node.js',
    status: 'ok',
    detail: `Running on Node.js ${process.version}`,
    version: process.version,
    path: process.execPath,
  }
}

async function checkNpm(): Promise<DoctorCheck> {
  const npmPath = path.join(path.dirname(process.execPath), 'npm')
  if (!existsSync(npmPath)) {
    return {
      name: 'npm',
      status: 'missing',
      detail: `npm not found at ${npmPath}`,
    }
  }

  const result = await spawnVersion(npmPath, ['--version'])
  if (result.exitCode !== 0) {
    return {
      name: 'npm',
      status: 'warn',
      detail: `npm found but failed to get version`,
      path: npmPath,
    }
  }

  return {
    name: 'npm',
    status: 'ok',
    detail: `npm ${result.stdout}`,
    version: result.stdout,
    path: npmPath,
  }
}

async function checkChromium(): Promise<DoctorCheck> {
  // Check flatpak first
  const flatpakResult = await spawnVersion('flatpak', [
    'info',
    'org.chromium.Chromium',
  ])
  if (flatpakResult.exitCode === 0) {
    // Extract version from flatpak info output
    const versionMatch = flatpakResult.stdout.match(/Version:\s*(.+)/i)
    return {
      name: 'Chromium',
      status: 'ok',
      detail: `Chromium via flatpak${versionMatch ? ` (${versionMatch[1].trim()})` : ''}`,
      version: versionMatch?.[1]?.trim(),
      path: 'flatpak run org.chromium.Chromium',
    }
  }

  // Scan common binary paths
  const candidates = [
    '/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
    '/snap/bin/chromium',
  ]
  for (const candidate of candidates) {
    if (existsSync(candidate)) {
      const result = await spawnVersion(candidate, ['--version'])
      return {
        name: 'Chromium',
        status: 'ok',
        detail: result.stdout || `Found at ${candidate}`,
        version: result.stdout || undefined,
        path: candidate,
      }
    }
  }

  return {
    name: 'Chromium',
    status: 'missing',
    detail: 'No Chromium/Chrome installation found',
  }
}

async function checkRipgrep(): Promise<DoctorCheck> {
  // Check /usr/bin/rg first, then fall back to PATH
  const rgPath = existsSync('/usr/bin/rg') ? '/usr/bin/rg' : 'rg'
  const result = await spawnVersion(rgPath, ['--version'])

  if (result.exitCode !== 0) {
    return {
      name: 'Ripgrep',
      status: 'missing',
      detail: 'ripgrep (rg) not found',
    }
  }

  const version =
    result.stdout.split('\n')[0]?.replace('ripgrep ', '') ?? result.stdout
  return {
    name: 'Ripgrep',
    status: 'ok',
    detail: `ripgrep ${version}`,
    version,
    path: rgPath === 'rg' ? undefined : rgPath,
  }
}

async function checkGit(): Promise<DoctorCheck> {
  const result = await spawnVersion('git', ['--version'])
  if (result.exitCode !== 0) {
    return {
      name: 'Git',
      status: 'missing',
      detail: 'git not found',
    }
  }

  const version = result.stdout.replace('git version ', '')
  return {
    name: 'Git',
    status: 'ok',
    detail: `git ${version}`,
    version,
  }
}

function checkMonorepo(rootDir: string): DoctorCheck {
  const pkgPath = path.join(rootDir, 'package.json')
  if (!existsSync(pkgPath)) {
    return {
      name: 'Monorepo',
      status: 'missing',
      detail: `No package.json found at ${rootDir}`,
    }
  }

  try {
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'))
    if (pkg.workspaces) {
      return {
        name: 'Monorepo',
        status: 'ok',
        detail: `Workspaces: ${Array.isArray(pkg.workspaces) ? pkg.workspaces.join(', ') : JSON.stringify(pkg.workspaces)}`,
        path: rootDir,
      }
    }
    return {
      name: 'Monorepo',
      status: 'warn',
      detail: 'package.json found but no workspaces field',
      path: rootDir,
    }
  } catch {
    return {
      name: 'Monorepo',
      status: 'warn',
      detail: 'Failed to parse package.json',
      path: rootDir,
    }
  }
}

function checkVite(rootDir: string): DoctorCheck {
  const vitePath = path.join(
    rootDir,
    'packages',
    'web',
    'node_modules',
    '.bin',
    'vite',
  )
  if (existsSync(vitePath)) {
    return {
      name: 'Vite',
      status: 'ok',
      detail: 'Vite found in @quickplan/web',
      path: vitePath,
    }
  }

  return {
    name: 'Vite',
    status: 'warn',
    detail: 'Vite not found — run npm install in @quickplan/web',
  }
}

async function executeDoctor(
  ctx: CommandContext,
): Promise<CommandResult<DoctorResult>> {
  ctx.app.log('debug', 'Running environment checks...')

  const checks: DoctorCheck[] = await Promise.all([
    checkNode(),
    checkNpm(),
    checkChromium(),
    checkRipgrep(),
    checkGit(),
  ])

  // Sync checks
  checks.push(checkMonorepo(ctx.rootDir))
  checks.push(checkVite(ctx.rootDir))

  const summary = {
    ok: checks.filter((c) => c.status === 'ok').length,
    warn: checks.filter((c) => c.status === 'warn').length,
    missing: checks.filter((c) => c.status === 'missing').length,
  }

  return { ok: true, data: { checks, summary } }
}

async function planDoctor(): Promise<CommandPlan> {
  return {
    steps: [
      {
        id: 'check-env',
        description:
          'Check Node.js, npm, Chromium, ripgrep, git, monorepo, and Vite',
        dependsOn: [],
      },
    ],
  }
}

export const doctorGroup: CommandGroup = {
  name: 'doctor',
  description: 'Check the development environment',
  commands: [
    {
      name: 'doctor',
      description: 'Run diagnostics on the development environment',
      execute: executeDoctor,
      plan: planDoctor,
    },
  ],
}
