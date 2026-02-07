import { EventEmitter } from 'node:events';
import os from 'node:os';
import path from 'node:path';
import { CommandRegistry } from './registry.js';
export class DevToolsApp {
    emitter = new EventEmitter();
    registry = new CommandRegistry();
    rootDir;
    dataDir;
    constructor(rootDir, dataDir) {
        this.rootDir = rootDir;
        this.dataDir = dataDir ?? path.join(os.homedir(), '.qpd');
    }
    // ── Event methods ──────────────────────────────────────────────
    emit(type, event) {
        this.emitter.emit(type, event);
    }
    on(type, listener) {
        this.emitter.on(type, listener);
    }
    off(type, listener) {
        this.emitter.off(type, listener);
    }
    // ── Convenience helpers ────────────────────────────────────────
    log(level, message, data) {
        this.emit('log', { timestamp: Date.now(), level, message, data });
    }
    progress(group, command, message, current, total) {
        this.emit('progress', {
            timestamp: Date.now(),
            group,
            command,
            message,
            current,
            total,
        });
    }
    // ── Registry ───────────────────────────────────────────────────
    register(group) {
        this.registry.register(group);
    }
    getRegistry() {
        return this.registry;
    }
    // ── Execute ────────────────────────────────────────────────────
    async execute(groupName, commandName, args, options, stdin) {
        const command = this.registry.getCommand(groupName, commandName);
        if (!command) {
            return {
                ok: false,
                error: `Unknown command: ${groupName} ${commandName}`,
            };
        }
        const ctx = {
            app: this,
            rootDir: this.rootDir,
            dataDir: this.dataDir,
            options,
            stdin,
        };
        // Dry-run: call plan() if available
        if (options.dryRun && command.plan) {
            try {
                const plan = await command.plan(ctx, args);
                this.emit('command:plan', {
                    timestamp: Date.now(),
                    group: groupName,
                    command: commandName,
                    plan,
                });
                return { ok: true, data: plan };
            }
            catch (err) {
                const error = err instanceof Error ? err.message : 'Plan generation failed';
                this.emit('command:error', {
                    timestamp: Date.now(),
                    group: groupName,
                    command: commandName,
                    error,
                });
                return { ok: false, error };
            }
        }
        // Normal execution
        const startTime = Date.now();
        this.emit('command:start', {
            timestamp: startTime,
            group: groupName,
            command: commandName,
            args,
            dryRun: false,
        });
        try {
            const result = await command.execute(ctx, args);
            this.emit('command:end', {
                timestamp: Date.now(),
                group: groupName,
                command: commandName,
                result,
                durationMs: Date.now() - startTime,
            });
            return result;
        }
        catch (err) {
            const error = err instanceof Error ? err.message : 'Command failed';
            this.emit('command:error', {
                timestamp: Date.now(),
                group: groupName,
                command: commandName,
                error,
            });
            return { ok: false, error };
        }
    }
}
//# sourceMappingURL=app.js.map