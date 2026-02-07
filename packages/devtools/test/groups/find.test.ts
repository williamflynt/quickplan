import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import { DevToolsApp } from '../../src/core/app.js';
import { findGroup } from '../../src/groups/find/index.js';
import type { GlobalOptions } from '../../src/core/types.js';

const defaultOptions: GlobalOptions = {
  verbose: false,
  quiet: false,
  dryRun: false,
  nonInteractive: false,
};

describe('find command', () => {
  let tmpDir: string;
  let app: DevToolsApp;

  beforeEach(async () => {
    tmpDir = await mkdtemp(path.join(os.tmpdir(), 'qpd-find-test-'));
    // Create test file structure
    await mkdir(path.join(tmpDir, 'src', 'components'), { recursive: true });
    await mkdir(path.join(tmpDir, 'src', 'utils'), { recursive: true });
    await mkdir(path.join(tmpDir, 'config'), { recursive: true });

    await writeFile(path.join(tmpDir, 'package.json'), '{}');
    await writeFile(path.join(tmpDir, 'tsconfig.json'), '{}');
    await writeFile(path.join(tmpDir, 'src', 'index.ts'), '');
    await writeFile(path.join(tmpDir, 'src', 'components', 'App.tsx'), '');
    await writeFile(path.join(tmpDir, 'src', 'components', 'Header.tsx'), '');
    await writeFile(path.join(tmpDir, 'src', 'utils', 'helpers.ts'), '');
    await writeFile(path.join(tmpDir, 'config', 'tsconfig.node.json'), '{}');

    app = new DevToolsApp(tmpDir);
    app.register(findGroup);
  });

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });

  it('finds files by exact name', async () => {
    const result = await app.execute(
      'find',
      'find',
      { pattern: 'package.json' },
      defaultOptions,
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toEqual(['package.json']);
    }
  });

  it('finds files by glob pattern', async () => {
    const result = await app.execute(
      'find',
      'find',
      { pattern: '*.tsx' },
      defaultOptions,
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      const data = result.data as string[];
      expect(data).toHaveLength(2);
      expect(data).toContain('src/components/App.tsx');
      expect(data).toContain('src/components/Header.tsx');
    }
  });

  it('finds files by path glob', async () => {
    const result = await app.execute(
      'find',
      'find',
      { pattern: 'src/**/*.ts' },
      defaultOptions,
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      const data = result.data as string[];
      expect(data).toContain('src/index.ts');
      expect(data).toContain('src/utils/helpers.ts');
    }
  });

  it('returns empty array for no matches', async () => {
    const result = await app.execute(
      'find',
      'find',
      { pattern: 'nope.nope' },
      defaultOptions,
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toEqual([]);
    }
  });

  it('supports --absolute flag', async () => {
    const result = await app.execute(
      'find',
      'find',
      { pattern: 'package.json', absolute: true },
      defaultOptions,
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      const data = result.data as string[];
      expect(data).toHaveLength(1);
      expect(path.isAbsolute(data[0])).toBe(true);
      expect(data[0]).toBe(path.join(tmpDir, 'package.json'));
    }
  });

  it('supports --cwd option', async () => {
    const result = await app.execute(
      'find',
      'find',
      { pattern: '*.tsx', cwd: 'src/components' },
      defaultOptions,
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      const data = result.data as string[];
      expect(data).toHaveLength(2);
      // Paths are relative to the cwd, not root
      expect(data).toContain('App.tsx');
      expect(data).toContain('Header.tsx');
    }
  });

  it('returns sorted results', async () => {
    const result = await app.execute(
      'find',
      'find',
      { pattern: '*.json' },
      defaultOptions,
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      const data = result.data as string[];
      const sorted = [...data].sort();
      expect(data).toEqual(sorted);
    }
  });

  it('returns plan in dry-run mode', async () => {
    const result = await app.execute(
      'find',
      'find',
      { pattern: '*.ts' },
      { ...defaultOptions, dryRun: true },
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      const data = result.data as { steps: unknown[] };
      expect(data.steps).toHaveLength(1);
    }
  });
});
