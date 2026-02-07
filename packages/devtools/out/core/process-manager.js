import { spawn } from 'node:child_process';
import { createInterface } from 'node:readline';
export class ProcessManager {
    processes = new Map();
    app;
    constructor(app) {
        this.app = app;
    }
    spawn(id, command, args, opts) {
        if (this.processes.has(id)) {
            throw new Error(`Process "${id}" is already running`);
        }
        const spawnOpts = {
            cwd: opts?.cwd,
            env: opts?.env,
            stdio: ['pipe', 'pipe', 'pipe'],
            detached: opts?.detached,
        };
        const child = spawn(command, args, spawnOpts);
        const managed = { id, pid: child.pid, child };
        this.processes.set(id, managed);
        // Stream stdout line-by-line
        if (child.stdout) {
            const rl = createInterface({ input: child.stdout });
            rl.on('line', (line) => {
                this.app.emit('process:stdout', {
                    timestamp: Date.now(),
                    source: id,
                    line,
                });
            });
        }
        // Stream stderr line-by-line
        if (child.stderr) {
            const rl = createInterface({ input: child.stderr });
            rl.on('line', (line) => {
                this.app.emit('process:stderr', {
                    timestamp: Date.now(),
                    source: id,
                    line,
                });
            });
        }
        child.on('exit', (code, signal) => {
            this.app.emit('process:exit', {
                timestamp: Date.now(),
                source: id,
                exitCode: code,
                signal: signal,
            });
            this.processes.delete(id);
        });
        child.on('error', (err) => {
            this.app.log('error', `Process "${id}" error: ${err.message}`);
            this.processes.delete(id);
        });
        return managed;
    }
    async kill(id, signal = 'SIGTERM') {
        const proc = this.processes.get(id);
        if (!proc)
            return;
        proc.child.kill(signal);
        await this.waitForExit(id);
    }
    async killAll(signal = 'SIGTERM') {
        const ids = [...this.processes.keys()];
        await Promise.all(ids.map((id) => this.kill(id, signal)));
    }
    get(id) {
        return this.processes.get(id);
    }
    isRunning(id) {
        return this.processes.has(id);
    }
    waitForExit(id) {
        const proc = this.processes.get(id);
        if (!proc)
            return Promise.resolve(null);
        return new Promise((resolve) => {
            proc.child.on('exit', (code) => resolve(code));
        });
    }
    waitForOutput(id, pattern, timeoutMs = 30_000) {
        return new Promise((resolve, reject) => {
            const timer = setTimeout(() => {
                cleanup();
                reject(new Error(`Timed out waiting for output matching ${pattern} from "${id}"`));
            }, timeoutMs);
            const handler = (event) => {
                if (event.source === id && pattern.test(event.line)) {
                    cleanup();
                    resolve(event.line);
                }
            };
            const exitHandler = (event) => {
                if (event.source === id) {
                    cleanup();
                    reject(new Error(`Process "${id}" exited before output matched ${pattern}`));
                }
            };
            const cleanup = () => {
                clearTimeout(timer);
                this.app.off('process:stdout', handler);
                this.app.off('process:stderr', handler);
                this.app.off('process:exit', exitHandler);
            };
            this.app.on('process:stdout', handler);
            this.app.on('process:stderr', handler);
            this.app.on('process:exit', exitHandler);
        });
    }
}
//# sourceMappingURL=process-manager.js.map