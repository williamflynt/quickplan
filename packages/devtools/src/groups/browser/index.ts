import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname } from 'node:path'
import type {
  CommandContext,
  CommandGroup,
  CommandPlan,
  CommandResult,
} from '../../core/types.js'
import { CDPClient, type LogEntry } from '../../core/cdp-client.js'

type CdpOpts = { cdpPort?: string }

function cdpPort(rawArgs: Record<string, unknown>): number {
  return parseInt((rawArgs as CdpOpts).cdpPort ?? '9222', 10)
}

async function withClient<T>(
  port: number,
  fn: (client: CDPClient) => Promise<T>,
): Promise<CommandResult<T>> {
  const client = new CDPClient()
  try {
    await client.connect({ port })
    const data = await fn(client)
    return { ok: true, data }
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    }
  } finally {
    await client.disconnect().catch(() => {})
  }
}

// ── content ─────────────────────────────────────────────────────────

async function executeContent(
  _ctx: CommandContext,
  rawArgs: Record<string, unknown>,
): Promise<CommandResult> {
  const format = (rawArgs.format as string) ?? 'text'
  return withClient(cdpPort(rawArgs), async (client) => {
    const content = await client.getPageContent()
    if (format === 'html') {
      return { url: content.url, title: content.title, html: content.html }
    }
    return { url: content.url, title: content.title, text: content.text }
  })
}

// ── navigate ────────────────────────────────────────────────────────

async function executeNavigate(
  _ctx: CommandContext,
  rawArgs: Record<string, unknown>,
): Promise<CommandResult> {
  const url = rawArgs.url as string
  const waitUntil = (rawArgs.waitUntil as 'load' | 'domcontentloaded') ?? 'load'
  return withClient(cdpPort(rawArgs), async (client) => {
    await client.navigate(url, waitUntil)
    return { navigated: url }
  })
}

// ── eval ────────────────────────────────────────────────────────────

async function executeEval(
  _ctx: CommandContext,
  rawArgs: Record<string, unknown>,
): Promise<CommandResult> {
  const expression = rawArgs.expression as string
  return withClient(cdpPort(rawArgs), async (client) => {
    const result = await client.evaluate(expression)
    return { result }
  })
}

// ── click ───────────────────────────────────────────────────────────

async function executeClick(
  _ctx: CommandContext,
  rawArgs: Record<string, unknown>,
): Promise<CommandResult> {
  const selector = rawArgs.selector as string
  return withClient(cdpPort(rawArgs), async (client) => {
    await client.click(selector)
    return { clicked: selector }
  })
}

// ── type ────────────────────────────────────────────────────────────

async function executeType(
  _ctx: CommandContext,
  rawArgs: Record<string, unknown>,
): Promise<CommandResult> {
  const selector = rawArgs.selector as string
  const text = rawArgs.text as string
  const delay = parseInt((rawArgs.delay as string) ?? '0', 10)
  return withClient(cdpPort(rawArgs), async (client) => {
    await client.type(selector, text, delay)
    return { typed: text, selector }
  })
}

// ── wait ────────────────────────────────────────────────────────────

async function executeWait(
  _ctx: CommandContext,
  rawArgs: Record<string, unknown>,
): Promise<CommandResult> {
  const selector = rawArgs.selector as string
  const timeout = parseInt((rawArgs.timeout as string) ?? '5000', 10)
  return withClient(cdpPort(rawArgs), async (client) => {
    await client.waitForSelector(selector, timeout)
    return { found: selector }
  })
}

// ── screenshot ──────────────────────────────────────────────────────

async function executeScreenshot(
  _ctx: CommandContext,
  rawArgs: Record<string, unknown>,
): Promise<CommandResult> {
  const output = rawArgs.output as string | undefined
  const fullPage = rawArgs.fullPage as boolean | undefined
  return withClient(cdpPort(rawArgs), async (client) => {
    const base64 = await client.screenshot({ fullPage })
    if (output) {
      mkdirSync(dirname(output), { recursive: true })
      const buf = Buffer.from(base64, 'base64')
      writeFileSync(output, buf)
      return { file: output, size: buf.length }
    }
    return { base64 }
  })
}

// ── set-editor ─────────────────────────────────────────────────────

async function executeSetEditor(
  _ctx: CommandContext,
  rawArgs: Record<string, unknown>,
): Promise<CommandResult> {
  const text = rawArgs.text as string
  const append = !!rawArgs.append
  return withClient(cdpPort(rawArgs), async (client) => {
    await client.evaluate(`(() => {
      const editor = window.__qpd_editor;
      if (!editor) throw new Error('Monaco editor not found (window.__qpd_editor)');
      if (${append}) {
        const current = editor.getValue();
        editor.setValue(current + ${JSON.stringify(text)});
      } else {
        editor.setValue(${JSON.stringify(text)});
      }
    })()`)
    return {
      set: true,
      mode: append ? 'append' : 'replace',
      length: text.length,
    }
  })
}

// ── logs ────────────────────────────────────────────────────────────

function formatLogEntry(entry: LogEntry): string {
  const ts = new Date(entry.timestamp).toISOString().slice(11, 23)
  const src = entry.source.padEnd(9)
  const lvl = entry.level.padEnd(7)
  return `${ts} [${src}] ${lvl} ${entry.text}`
}

async function executeLogs(
  ctx: CommandContext,
  rawArgs: Record<string, unknown>,
): Promise<CommandResult> {
  const port = cdpPort(rawArgs)
  const network = !!rawArgs.network
  const lines = parseInt((rawArgs.lines as string) ?? '50', 10)
  const follow = !ctx.options.nonInteractive && rawArgs.follow !== false

  const client = new CDPClient()
  try {
    await client.connect({ port })

    const entries: LogEntry[] = []

    await client.subscribeLogs({ network }, (entry) => {
      if (follow) {
        process.stdout.write(formatLogEntry(entry) + '\n')
      } else {
        entries.push(entry)
      }
    })

    if (follow) {
      // Stream until SIGINT/SIGTERM
      await new Promise<void>((resolve) => {
        const cleanup = () => resolve()
        process.once('SIGINT', cleanup)
        process.once('SIGTERM', cleanup)
      })
      return { ok: true, data: { streamed: true } }
    }

    // Non-interactive: collect for a short window, then return
    const duration = parseInt((rawArgs.duration as string) ?? '2000', 10)
    await new Promise((r) => setTimeout(r, duration))

    const trimmed = entries.slice(-lines)
    return {
      ok: true,
      data: {
        entries: trimmed.map((e) => ({
          ...e,
          formatted: formatLogEntry(e),
        })),
        count: trimmed.length,
        truncated: entries.length > lines,
      },
    }
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    }
  } finally {
    await client.disconnect().catch(() => {})
  }
}

// ── targets ─────────────────────────────────────────────────────────

async function executeTargets(
  _ctx: CommandContext,
  rawArgs: Record<string, unknown>,
): Promise<CommandResult> {
  const port = cdpPort(rawArgs)
  const client = new CDPClient()
  try {
    const targets = await client.listTargets({ port })
    return { ok: true, data: { targets } }
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    }
  }
}

// ── plan ────────────────────────────────────────────────────────────

function makePlan(
  description: string,
): (_ctx: CommandContext) => Promise<CommandPlan> {
  return async () => ({
    steps: [{ id: 'cdp', description, dependsOn: [] }],
  })
}

// ── shared options ──────────────────────────────────────────────────

const cdpPortOption = {
  flags: '--cdp-port <port>',
  description: 'CDP debugging port',
  defaultValue: '9222',
}

export const browserGroup: CommandGroup = {
  name: 'browser',
  description: 'Interact with the browser via Chrome DevTools Protocol',
  commands: [
    {
      name: 'content',
      description: 'Get rendered page content',
      options: [
        cdpPortOption,
        {
          flags: '--format <format>',
          description: 'Output format: html or text',
          defaultValue: 'text',
        },
      ],
      execute: executeContent,
      plan: makePlan('Fetch page content via CDP'),
    },
    {
      name: 'navigate',
      description: 'Navigate the browser to a URL',
      args: ['<url>'],
      options: [
        cdpPortOption,
        {
          flags: '--wait-until <event>',
          description: 'Wait for: load or domcontentloaded',
          defaultValue: 'load',
        },
      ],
      execute: executeNavigate,
      plan: makePlan('Navigate browser via CDP'),
    },
    {
      name: 'eval',
      description: 'Evaluate JavaScript in the page',
      args: ['<expression>'],
      options: [cdpPortOption],
      execute: executeEval,
      plan: makePlan('Evaluate expression via CDP'),
    },
    {
      name: 'click',
      description: 'Click an element by CSS selector',
      args: ['<selector>'],
      options: [cdpPortOption],
      execute: executeClick,
      plan: makePlan('Click element via CDP'),
    },
    {
      name: 'type',
      description: 'Type text into an element',
      args: ['<selector>', '<text>'],
      options: [
        cdpPortOption,
        {
          flags: '--delay <ms>',
          description: 'Delay between keystrokes in ms',
          defaultValue: '0',
        },
      ],
      execute: executeType,
      plan: makePlan('Type into element via CDP'),
    },
    {
      name: 'wait',
      description: 'Wait for an element to appear',
      args: ['<selector>'],
      options: [
        cdpPortOption,
        {
          flags: '--timeout <ms>',
          description: 'Timeout in milliseconds',
          defaultValue: '5000',
        },
      ],
      execute: executeWait,
      plan: makePlan('Wait for element via CDP'),
    },
    {
      name: 'screenshot',
      description: 'Capture a screenshot',
      options: [
        cdpPortOption,
        {
          flags: '-o, --output <file>',
          description: 'Save to file instead of base64 stdout',
        },
        {
          flags: '--full-page',
          description: 'Capture the full scrollable page',
        },
      ],
      execute: executeScreenshot,
      plan: makePlan('Capture screenshot via CDP'),
    },
    {
      name: 'set-editor',
      description: 'Set the Monaco editor content',
      args: ['<text>'],
      options: [
        cdpPortOption,
        {
          flags: '--append',
          description: 'Append to existing content instead of replacing',
        },
      ],
      execute: executeSetEditor,
      plan: makePlan('Set Monaco editor content via CDP'),
    },
    {
      name: 'targets',
      description: 'List CDP targets',
      options: [cdpPortOption],
      execute: executeTargets,
      plan: makePlan('List CDP targets'),
    },
    {
      name: 'logs',
      description: 'Stream browser logs (console, exceptions, network)',
      options: [
        cdpPortOption,
        {
          flags: '--no-follow',
          description: 'Collect logs for a duration instead of streaming',
        },
        {
          flags: '--network',
          description: 'Include network request/response events',
        },
        {
          flags: '--lines <n>',
          description: 'Max entries to return in non-follow mode',
          defaultValue: '50',
        },
        {
          flags: '--duration <ms>',
          description: 'Collection duration in ms for non-follow mode',
          defaultValue: '2000',
        },
      ],
      execute: executeLogs,
      plan: makePlan('Stream browser logs via CDP'),
    },
  ],
}
