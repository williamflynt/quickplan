import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import { DevToolsApp } from '../../src/core/app.js';
import { doctorGroup } from '../../src/groups/doctor/index.js';
import type { DoctorCheck } from '../../src/groups/doctor/index.js';
import type { GlobalOptions } from '../../src/core/types.js';

const defaultOptions: GlobalOptions = {
  verbose: false,
  quiet: false,
  dryRun: false,
  nonInteractive: false,
};

type DoctorResult = {
  checks: DoctorCheck[];
  summary: { ok: number; warn: number; missing: number };
};

describe('doctor command', () => {
  let tmpDir: string;
  let app: DevToolsApp;

  beforeEach(async () => {
    tmpDir = await mkdtemp(path.join(os.tmpdir(), 'qpd-doctor-test-'));
    app = new DevToolsApp(tmpDir);
    app.register(doctorGroup);
  });

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });

  it('returns ok result with checks array', async () => {
    const result = await app.execute('doctor', 'doctor', {}, defaultOptions);

    expect(result.ok).toBe(true);
    if (result.ok) {
      const data = result.data as DoctorResult;
      expect(data.checks).toBeInstanceOf(Array);
      expect(data.checks.length).toBeGreaterThan(0);
      expect(data.summary).toHaveProperty('ok');
      expect(data.summary).toHaveProperty('warn');
      expect(data.summary).toHaveProperty('missing');
    }
  });

  it('always reports Node.js as ok', async () => {
    const result = await app.execute('doctor', 'doctor', {}, defaultOptions);

    expect(result.ok).toBe(true);
    if (result.ok) {
      const data = result.data as DoctorResult;
      const nodeCheck = data.checks.find((c) => c.name === 'Node.js');
      expect(nodeCheck).toBeDefined();
      expect(nodeCheck!.status).toBe('ok');
      expect(nodeCheck!.version).toBe(process.version);
      expect(nodeCheck!.path).toBe(process.execPath);
    }
  });

  it('checks npm and finds it alongside node', async () => {
    const result = await app.execute('doctor', 'doctor', {}, defaultOptions);

    expect(result.ok).toBe(true);
    if (result.ok) {
      const data = result.data as DoctorResult;
      const npmCheck = data.checks.find((c) => c.name === 'npm');
      expect(npmCheck).toBeDefined();
      expect(npmCheck!.status).toBe('ok');
      expect(npmCheck!.version).toBeTruthy();
    }
  });

  it('checks git availability', async () => {
    const result = await app.execute('doctor', 'doctor', {}, defaultOptions);

    expect(result.ok).toBe(true);
    if (result.ok) {
      const data = result.data as DoctorResult;
      const gitCheck = data.checks.find((c) => c.name === 'Git');
      expect(gitCheck).toBeDefined();
      // Git should be available on dev machine
      expect(gitCheck!.status).toBe('ok');
    }
  });

  it('reports monorepo as warn when no workspaces in tmpdir', async () => {
    // Create package.json without workspaces
    await writeFile(
      path.join(tmpDir, 'package.json'),
      JSON.stringify({ name: 'test' }),
    );

    const result = await app.execute('doctor', 'doctor', {}, defaultOptions);

    expect(result.ok).toBe(true);
    if (result.ok) {
      const data = result.data as DoctorResult;
      const monoCheck = data.checks.find((c) => c.name === 'Monorepo');
      expect(monoCheck).toBeDefined();
      expect(monoCheck!.status).toBe('warn');
    }
  });

  it('reports monorepo as ok with workspaces', async () => {
    await writeFile(
      path.join(tmpDir, 'package.json'),
      JSON.stringify({ name: 'test', workspaces: ['packages/*'] }),
    );

    const result = await app.execute('doctor', 'doctor', {}, defaultOptions);

    expect(result.ok).toBe(true);
    if (result.ok) {
      const data = result.data as DoctorResult;
      const monoCheck = data.checks.find((c) => c.name === 'Monorepo');
      expect(monoCheck).toBeDefined();
      expect(monoCheck!.status).toBe('ok');
    }
  });

  it('reports monorepo as missing when no package.json', async () => {
    const result = await app.execute('doctor', 'doctor', {}, defaultOptions);

    expect(result.ok).toBe(true);
    if (result.ok) {
      const data = result.data as DoctorResult;
      const monoCheck = data.checks.find((c) => c.name === 'Monorepo');
      expect(monoCheck).toBeDefined();
      expect(monoCheck!.status).toBe('missing');
    }
  });

  it('summary counts match check statuses', async () => {
    const result = await app.execute('doctor', 'doctor', {}, defaultOptions);

    expect(result.ok).toBe(true);
    if (result.ok) {
      const data = result.data as DoctorResult;
      const okCount = data.checks.filter((c) => c.status === 'ok').length;
      const warnCount = data.checks.filter((c) => c.status === 'warn').length;
      const missingCount = data.checks.filter(
        (c) => c.status === 'missing',
      ).length;

      expect(data.summary.ok).toBe(okCount);
      expect(data.summary.warn).toBe(warnCount);
      expect(data.summary.missing).toBe(missingCount);
      expect(okCount + warnCount + missingCount).toBe(data.checks.length);
    }
  });

  it('returns plan in dry-run mode', async () => {
    const result = await app.execute(
      'doctor',
      'doctor',
      {},
      { ...defaultOptions, dryRun: true },
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      const data = result.data as { steps: unknown[] };
      expect(data.steps).toHaveLength(1);
    }
  });
});
