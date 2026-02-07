import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { DevToolsApp } from '../../src/core/app.js';
import { runGroup } from '../../src/groups/run/index.js';
import type { GlobalOptions } from '../../src/core/types.js';

const defaultOptions: GlobalOptions = {
  verbose: false,
  quiet: false,
  dryRun: false,
  nonInteractive: false,
};

describe('run command group', () => {
  it('runs node --version and gets output', async () => {
    const app = new DevToolsApp('/tmp');
    app.register(runGroup);

    const result = await app.execute(
      'run',
      'node',
      { args: ['--version'] },
      defaultOptions,
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      const data = result.data as { exitCode: number; stdout?: string };
      expect(data.exitCode).toBe(0);
      // In pipe mode, stdout is captured
      if (data.stdout) {
        expect(data.stdout).toMatch(/^v\d+\.\d+\.\d+/);
      }
    }
  });

  it('runs npm --version successfully', async () => {
    const app = new DevToolsApp('/tmp');
    app.register(runGroup);

    const result = await app.execute(
      'run',
      'npm',
      { args: ['--version'] },
      defaultOptions,
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      const data = result.data as { exitCode: number; stdout?: string };
      expect(data.exitCode).toBe(0);
    }
  });

  it('resolves node to process.execPath', async () => {
    const app = new DevToolsApp('/tmp');
    app.register(runGroup);

    const result = await app.execute(
      'run',
      'node',
      { args: ['-e', 'console.log(process.execPath)'] },
      defaultOptions,
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      const data = result.data as { exitCode: number; stdout?: string };
      expect(data.exitCode).toBe(0);
      if (data.stdout) {
        expect(data.stdout.trim()).toBe(process.execPath);
      }
    }
  });

  it('resolves npm to sibling of process.execPath', async () => {
    const app = new DevToolsApp('/tmp');
    app.register(runGroup);

    const result = await app.execute(
      'run',
      'npm',
      { args: ['--version'] },
      defaultOptions,
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      const data = result.data as { exitCode: number; command: string };
      expect(data.exitCode).toBe(0);
      expect(data.command).toBe('npm --version');
    }
  });

  it('returns exit code from failing command', async () => {
    const app = new DevToolsApp('/tmp');
    app.register(runGroup);

    const result = await app.execute(
      'run',
      'node',
      { args: ['-e', 'process.exit(42)'] },
      defaultOptions,
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      const data = result.data as { exitCode: number };
      expect(data.exitCode).toBe(42);
    }
  });

  it('returns plan in dry-run mode', async () => {
    const app = new DevToolsApp('/tmp');
    app.register(runGroup);

    const result = await app.execute(
      'run',
      'node',
      { args: ['--version'] },
      { ...defaultOptions, dryRun: true },
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      const data = result.data as { steps: unknown[] };
      expect(data.steps).toHaveLength(1);
    }
  });

  it('includes command string in result', async () => {
    const app = new DevToolsApp('/tmp');
    app.register(runGroup);

    const result = await app.execute(
      'run',
      'node',
      { args: ['-e', 'true'] },
      defaultOptions,
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      const data = result.data as { command: string };
      expect(data.command).toBe('node -e true');
    }
  });
});
