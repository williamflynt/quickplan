import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import { DevToolsApp } from '../../src/core/app.js';
import { searchGroup } from '../../src/groups/grep/index.js';
import type { SearchMatch } from '../../src/groups/grep/index.js';
import type { GlobalOptions } from '../../src/core/types.js';

const defaultOptions: GlobalOptions = {
  verbose: false,
  quiet: false,
  dryRun: false,
  nonInteractive: false,
};

type SearchResult = { matches: SearchMatch[] };

describe('search command', () => {
  let tmpDir: string;
  let app: DevToolsApp;

  beforeEach(async () => {
    tmpDir = await mkdtemp(path.join(os.tmpdir(), 'qpd-search-test-'));
    await mkdir(path.join(tmpDir, 'src'), { recursive: true });
    await mkdir(path.join(tmpDir, 'lib'), { recursive: true });

    await writeFile(
      path.join(tmpDir, 'src', 'main.ts'),
      'import chalk from "chalk";\n// TODO: add feature\nconst x = 1;\n',
    );
    await writeFile(
      path.join(tmpDir, 'src', 'utils.ts'),
      'export function helper() {\n  return 42;\n}\n// TODO: refactor\n',
    );
    await writeFile(
      path.join(tmpDir, 'lib', 'data.js'),
      'const data = "hello world";\nmodule.exports = data;\n',
    );

    app = new DevToolsApp(tmpDir);
    app.register(searchGroup);
  });

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });

  it('finds matches for a pattern', async () => {
    const result = await app.execute(
      'search',
      'search',
      { pattern: 'TODO' },
      defaultOptions,
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      const data = result.data as SearchResult;
      expect(data.matches.length).toBe(2);
      for (const match of data.matches) {
        expect(match.text).toContain('TODO');
        expect(match.line).toBeGreaterThan(0);
        expect(match.column).toBeGreaterThan(0);
      }
    }
  });

  it('returns empty matches when nothing found', async () => {
    const result = await app.execute(
      'search',
      'search',
      { pattern: 'NONEXISTENT_XYZ' },
      defaultOptions,
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      const data = result.data as SearchResult;
      expect(data.matches).toHaveLength(0);
    }
  });

  it('filters by glob', async () => {
    const result = await app.execute(
      'search',
      'search',
      { pattern: 'TODO', glob: '*.ts' },
      defaultOptions,
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      const data = result.data as SearchResult;
      for (const match of data.matches) {
        expect(match.file).toMatch(/\.ts$/);
      }
    }
  });

  it('supports case-insensitive search', async () => {
    const result = await app.execute(
      'search',
      'search',
      { pattern: 'todo', ignoreCase: true },
      defaultOptions,
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      const data = result.data as SearchResult;
      expect(data.matches.length).toBe(2);
    }
  });

  it('searches a subdirectory', async () => {
    const result = await app.execute(
      'search',
      'search',
      { pattern: 'hello', path: 'lib' },
      defaultOptions,
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      const data = result.data as SearchResult;
      expect(data.matches).toHaveLength(1);
      expect(data.matches[0].file).toContain('lib');
    }
  });

  it('returns relative file paths', async () => {
    const result = await app.execute(
      'search',
      'search',
      { pattern: 'chalk' },
      defaultOptions,
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      const data = result.data as SearchResult;
      for (const match of data.matches) {
        expect(path.isAbsolute(match.file)).toBe(false);
      }
    }
  });

  it('returns plan in dry-run mode', async () => {
    const result = await app.execute(
      'search',
      'search',
      { pattern: 'test' },
      { ...defaultOptions, dryRun: true },
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      const data = result.data as { steps: unknown[] };
      expect(data.steps).toHaveLength(1);
    }
  });
});
