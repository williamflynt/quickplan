import { EventEmitter } from 'node:events'
import os from 'node:os'
import path from 'node:path'
import { CommandRegistry } from './registry.js'
import type {
  CommandGroup,
  CommandRegistryInterface,
  CommandResult,
  DevToolsAppInterface,
  DevToolsEventMap,
  GlobalOptions,
  LogLevel,
} from './types.js'

export class DevToolsApp implements DevToolsAppInterface {
  private emitter = new EventEmitter()
  private registry = new CommandRegistry()
  readonly rootDir: string
  readonly dataDir: string

  constructor(rootDir: string, dataDir?: string) {
    this.rootDir = rootDir
    this.dataDir = dataDir ?? path.join(os.homedir(), '.qpd')
  }

  // ── Event methods ──────────────────────────────────────────────

  emit<K extends keyof DevToolsEventMap>(
    type: K,
    event: DevToolsEventMap[K],
  ): void {
    this.emitter.emit(type, event)
  }

  on<K extends keyof DevToolsEventMap>(
    type: K,
    listener: (event: DevToolsEventMap[K]) => void,
  ): void {
    this.emitter.on(type, listener)
  }

  off<K extends keyof DevToolsEventMap>(
    type: K,
    listener: (event: DevToolsEventMap[K]) => void,
  ): void {
    this.emitter.off(type, listener)
  }

  // ── Convenience helpers ────────────────────────────────────────

  log(level: LogLevel, message: string, data?: unknown): void {
    this.emit('log', { timestamp: Date.now(), level, message, data })
  }

  progress(
    group: string,
    command: string,
    message: string,
    current?: number,
    total?: number,
  ): void {
    this.emit('progress', {
      timestamp: Date.now(),
      group,
      command,
      message,
      current,
      total,
    })
  }

  // ── Registry ───────────────────────────────────────────────────

  register(group: CommandGroup): void {
    this.registry.register(group)
  }

  getRegistry(): CommandRegistryInterface {
    return this.registry
  }

  // ── Execute ────────────────────────────────────────────────────

  async execute(
    groupName: string,
    commandName: string,
    args: Record<string, unknown>,
    options: GlobalOptions,
    stdin?: string,
  ): Promise<CommandResult> {
    const command = this.registry.getCommand(groupName, commandName)
    if (!command) {
      return {
        ok: false,
        error: `Unknown command: ${groupName} ${commandName}`,
      }
    }

    const ctx = {
      app: this,
      rootDir: this.rootDir,
      dataDir: this.dataDir,
      options,
      stdin,
    }

    // Dry-run: call plan() if available
    if (options.dryRun && command.plan) {
      try {
        const plan = await command.plan(ctx, args)
        this.emit('command:plan', {
          timestamp: Date.now(),
          group: groupName,
          command: commandName,
          plan,
        })
        return { ok: true, data: plan }
      } catch (err) {
        const error =
          err instanceof Error ? err.message : 'Plan generation failed'
        this.emit('command:error', {
          timestamp: Date.now(),
          group: groupName,
          command: commandName,
          error,
        })
        return { ok: false, error }
      }
    }

    // Normal execution
    const startTime = Date.now()
    this.emit('command:start', {
      timestamp: startTime,
      group: groupName,
      command: commandName,
      args,
      dryRun: false,
    })

    try {
      const result = await command.execute(ctx, args)
      this.emit('command:end', {
        timestamp: Date.now(),
        group: groupName,
        command: commandName,
        result,
        durationMs: Date.now() - startTime,
      })
      return result
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Command failed'
      this.emit('command:error', {
        timestamp: Date.now(),
        group: groupName,
        command: commandName,
        error,
      })
      return { ok: false, error }
    }
  }
}
