import { existsSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

describe('bootstrap binary resolution', () => {
  const binDir = path.dirname(process.execPath);

  it('process.execPath exists', () => {
    expect(existsSync(process.execPath)).toBe(true);
  });

  it('npm exists alongside node', () => {
    const npmPath = path.join(binDir, 'npm');
    expect(existsSync(npmPath)).toBe(true);
  });

  it('npx exists alongside node', () => {
    const npxPath = path.join(binDir, 'npx');
    expect(existsSync(npxPath)).toBe(true);
  });

  it('build-install.js exists', () => {
    const scriptPath = path.resolve(
      import.meta.dirname,
      '../../bin/build-install.js',
    );
    expect(existsSync(scriptPath)).toBe(true);
  });

  it('tsconfig.json exists in package dir', () => {
    const tsconfigPath = path.resolve(
      import.meta.dirname,
      '../../tsconfig.json',
    );
    expect(existsSync(tsconfigPath)).toBe(true);
  });
});
