import { describe, expect, it, afterEach } from 'vitest';
import { DevToolsApp } from '../../src/core/app.js';
import { ProcessManager } from '../../src/core/process-manager.js';

describe('ProcessManager', () => {
  let app: DevToolsApp;
  let pm: ProcessManager;

  afterEach(async () => {
    await pm?.killAll();
  });

  it('spawns a process and emits stdout events', async () => {
    app = new DevToolsApp('/tmp');
    pm = new ProcessManager(app);

    const lines: string[] = [];
    app.on('process:stdout', (e) => lines.push(e.line));

    pm.spawn('echo', process.execPath, ['-e', 'console.log("hello")']);
    await pm.waitForExit('echo');

    expect(lines).toContain('hello');
  });

  it('emits stderr events', async () => {
    app = new DevToolsApp('/tmp');
    pm = new ProcessManager(app);

    const lines: string[] = [];
    app.on('process:stderr', (e) => lines.push(e.line));

    pm.spawn('err', process.execPath, ['-e', 'console.error("oops")']);
    await pm.waitForExit('err');

    expect(lines).toContain('oops');
  });

  it('emits exit event with code', async () => {
    app = new DevToolsApp('/tmp');
    pm = new ProcessManager(app);

    const exits: { source: string; exitCode: number | null }[] = [];
    app.on('process:exit', (e) => exits.push({ source: e.source, exitCode: e.exitCode }));

    pm.spawn('code42', process.execPath, ['-e', 'process.exit(42)']);
    const code = await pm.waitForExit('code42');

    expect(code).toBe(42);
    expect(exits).toHaveLength(1);
    expect(exits[0].source).toBe('code42');
    expect(exits[0].exitCode).toBe(42);
  });

  it('tracks running processes', () => {
    app = new DevToolsApp('/tmp');
    pm = new ProcessManager(app);

    pm.spawn('sleeper', process.execPath, ['-e', 'setTimeout(() => {}, 60000)']);

    expect(pm.isRunning('sleeper')).toBe(true);
    expect(pm.isRunning('nonexistent')).toBe(false);
    expect(pm.get('sleeper')).toBeDefined();
  });

  it('kills a process', async () => {
    app = new DevToolsApp('/tmp');
    pm = new ProcessManager(app);

    pm.spawn('sleeper', process.execPath, ['-e', 'setTimeout(() => {}, 60000)']);
    expect(pm.isRunning('sleeper')).toBe(true);

    await pm.kill('sleeper');
    expect(pm.isRunning('sleeper')).toBe(false);
  });

  it('killAll stops all processes', async () => {
    app = new DevToolsApp('/tmp');
    pm = new ProcessManager(app);

    pm.spawn('a', process.execPath, ['-e', 'setTimeout(() => {}, 60000)']);
    pm.spawn('b', process.execPath, ['-e', 'setTimeout(() => {}, 60000)']);

    expect(pm.isRunning('a')).toBe(true);
    expect(pm.isRunning('b')).toBe(true);

    await pm.killAll();
    expect(pm.isRunning('a')).toBe(false);
    expect(pm.isRunning('b')).toBe(false);
  });

  it('waitForOutput resolves when pattern matches', async () => {
    app = new DevToolsApp('/tmp');
    pm = new ProcessManager(app);

    pm.spawn('marker', process.execPath, [
      '-e',
      'setTimeout(() => console.log("READY on port 5173"), 50)',
    ]);

    const line = await pm.waitForOutput('marker', /port \d+/, 5000);
    expect(line).toContain('5173');
  });

  it('waitForOutput rejects on timeout', async () => {
    app = new DevToolsApp('/tmp');
    pm = new ProcessManager(app);

    pm.spawn('silent', process.execPath, ['-e', 'setTimeout(() => {}, 60000)']);

    await expect(
      pm.waitForOutput('silent', /never/, 100),
    ).rejects.toThrow('Timed out');
  });

  it('throws when spawning duplicate id', () => {
    app = new DevToolsApp('/tmp');
    pm = new ProcessManager(app);

    pm.spawn('dup', process.execPath, ['-e', 'setTimeout(() => {}, 60000)']);
    expect(() =>
      pm.spawn('dup', process.execPath, ['-e', 'true']),
    ).toThrow('already running');
  });
});
