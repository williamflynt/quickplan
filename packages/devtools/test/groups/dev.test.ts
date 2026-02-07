import { mkdtemp, rm, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import { DevToolsApp } from '../../src/core/app.js';
import { devGroup } from '../../src/groups/dev/index.js';
import type { GlobalOptions } from '../../src/core/types.js';

const defaultOptions: GlobalOptions = {
  verbose: false,
  quiet: false,
  dryRun: false,
  nonInteractive: false,
};

describe('dev command group', () => {
  let tmpDir: string;
  let app: DevToolsApp;

  beforeEach(async () => {
    tmpDir = await mkdtemp(path.join(os.tmpdir(), 'qpd-dev-test-'));
    app = new DevToolsApp(tmpDir, path.join(tmpDir, '.qpd'));
    app.register(devGroup);
  });

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });

  it('stop returns error when no session running', async () => {
    const result = await app.execute('dev', 'stop', {}, defaultOptions);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain('No running dev session');
    }
  });

  it('status reports no session when none exists', async () => {
    const result = await app.execute('dev', 'status', {}, defaultOptions);
    expect(result.ok).toBe(true);
    if (result.ok) {
      const data = result.data as { running: boolean };
      expect(data.running).toBe(false);
    }
  });

  it('status reads state file correctly', async () => {
    // Write a fake state file with a non-existent PID
    await mkdir(path.join(tmpDir, '.qpd'), { recursive: true });
    await writeFile(
      path.join(tmpDir, '.qpd', 'dev.json'),
      JSON.stringify({
        vitePid: 999999999,
        port: 5173,
        startedAt: Date.now(),
      }),
    );

    const result = await app.execute('dev', 'status', {}, defaultOptions);
    expect(result.ok).toBe(true);
    if (result.ok) {
      const data = result.data as { running: boolean; vite: { alive: boolean } };
      expect(data.running).toBe(false);
      expect(data.vite.alive).toBe(false);
    }
  });

  it('stop cleans up state file for dead processes', async () => {
    await mkdir(path.join(tmpDir, '.qpd'), { recursive: true });
    await writeFile(
      path.join(tmpDir, '.qpd', 'dev.json'),
      JSON.stringify({
        vitePid: 999999999,
        port: 5173,
        startedAt: Date.now(),
      }),
    );

    const result = await app.execute('dev', 'stop', {}, defaultOptions);
    expect(result.ok).toBe(true);
    expect(existsSync(path.join(tmpDir, '.qpd', 'dev.json'))).toBe(false);
  });

  it('logs returns error when no log file exists', async () => {
    const result = await app.execute('dev', 'logs', {}, defaultOptions);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain('No log file');
    }
  });

  it('start returns plan in dry-run mode', async () => {
    const result = await app.execute(
      'dev',
      'start',
      { noBrowser: true },
      { ...defaultOptions, dryRun: true },
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      const data = result.data as { steps: { id: string }[] };
      expect(data.steps.length).toBeGreaterThanOrEqual(1);
      expect(data.steps[0].id).toBe('start-vite');
    }
  });

  it('start plan includes chromium step when browser enabled', async () => {
    const result = await app.execute(
      'dev',
      'start',
      {},
      { ...defaultOptions, dryRun: true },
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      const data = result.data as { steps: { id: string }[] };
      expect(data.steps.length).toBe(2);
      expect(data.steps[1].id).toBe('start-chromium');
    }
  });

  it('start detects already-running session', async () => {
    // Use our own PID — guaranteed to be alive
    await mkdir(path.join(tmpDir, '.qpd'), { recursive: true });
    await writeFile(
      path.join(tmpDir, '.qpd', 'dev.json'),
      JSON.stringify({
        vitePid: process.pid,
        port: 5173,
        startedAt: Date.now(),
      }),
    );

    const result = await app.execute(
      'dev',
      'start',
      { noBrowser: true },
      defaultOptions,
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain('already running');
    }
  });
});
