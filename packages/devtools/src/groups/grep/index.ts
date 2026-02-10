import { spawn } from 'node:child_process'
import { existsSync } from 'node:fs'
import path from 'node:path'
import type {
  CommandContext,
  CommandGroup,
  CommandPlan,
  CommandResult,
} from '../../core/types.js'

export type SearchMatch = {
  file: string
  line: number
  column: number
  text: string
}

type SearchResult = {
  matches: SearchMatch[]
}

type SearchArgs = {
  pattern: string
  path?: string
  glob?: string
  type?: string
  ignoreCase?: boolean
}

function findRg(): string {
  if (existsSync('/usr/bin/rg')) return '/usr/bin/rg'
  return 'rg'
}

interface RgJsonMatch {
  type: 'match'
  data: {
    path: { text: string }
    lines: { text: string }
    line_number: number
    submatches: { start: number; end: number }[]
  }
}

function parseMatches(output: string, rootDir: string): SearchMatch[] {
  const matches: SearchMatch[] = []
  for (const line of output.split('\n')) {
    if (!line) continue
    let parsed: { type: string }
    try {
      parsed = JSON.parse(line)
    } catch {
      continue
    }
    if (parsed.type !== 'match') continue
    const m = parsed as RgJsonMatch
    matches.push({
      file: path.relative(rootDir, m.data.path.text),
      line: m.data.line_number,
      column: (m.data.submatches[0]?.start ?? 0) + 1,
      text: m.data.lines.text.replace(/\n$/, ''),
    })
  }
  return matches
}

async function executeSearch(
  ctx: CommandContext,
  rawArgs: Record<string, unknown>,
): Promise<CommandResult<SearchResult>> {
  const args = rawArgs as unknown as SearchArgs
  const rgPath = findRg()
  const searchPath = args.path
    ? path.resolve(ctx.rootDir, args.path)
    : ctx.rootDir

  const rgArgs = ['--json']
  if (args.ignoreCase) rgArgs.push('-i')
  if (args.glob) rgArgs.push('--glob', args.glob)
  if (args.type) rgArgs.push('--type', args.type)
  rgArgs.push('--', args.pattern, searchPath)

  ctx.app.log('debug', `Running: rg ${rgArgs.join(' ')}`)

  return new Promise((resolve) => {
    const child = spawn(rgPath, rgArgs, {
      cwd: ctx.rootDir,
      stdio: ['pipe', 'pipe', 'pipe'],
    })

    const stdoutChunks: Buffer[] = []
    const stderrChunks: Buffer[] = []
    child.stdout.on('data', (chunk: Buffer) => stdoutChunks.push(chunk))
    child.stderr.on('data', (chunk: Buffer) => stderrChunks.push(chunk))

    child.on('close', (code) => {
      const stdout = Buffer.concat(stdoutChunks).toString('utf-8')
      const stderr = Buffer.concat(stderrChunks).toString('utf-8')

      if (code !== 0 && code !== 1) {
        resolve({
          ok: false,
          error: `ripgrep failed (exit ${code}): ${stderr}`.trim(),
        })
        return
      }

      resolve({
        ok: true,
        data: { matches: parseMatches(stdout, ctx.rootDir) },
      })
    })

    child.on('error', (err) => {
      resolve({
        ok: false,
        error: `Failed to spawn rg: ${err.message}. Run \`qpd doctor\` to check your environment.`,
      })
    })
  })
}

async function planSearch(
  _ctx: CommandContext,
  rawArgs: Record<string, unknown>,
): Promise<CommandPlan> {
  const args = rawArgs as unknown as SearchArgs
  return {
    steps: [
      {
        id: 'search',
        description: `Search for "${args.pattern}" using ripgrep`,
        dependsOn: [],
      },
    ],
  }
}

export const searchGroup: CommandGroup = {
  name: 'search',
  description: 'Search file contents',
  commands: [
    {
      name: 'search',
      description: 'Search for a pattern in project files',
      args: ['<pattern>', '[path]'],
      options: [
        {
          flags: '-g, --glob <pattern>',
          description: 'Only search files matching glob pattern',
        },
        {
          flags: '-t, --type <filetype>',
          description: 'Only search files of given type (e.g., ts, js, py)',
        },
        {
          flags: '-i, --ignore-case',
          description: 'Case-insensitive search',
        },
      ],
      execute: executeSearch,
      plan: planSearch,
    },
  ],
}
