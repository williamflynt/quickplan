import { readFileSync } from 'node:fs';
import path from 'node:path';
import { existsSync } from 'node:fs';
import { DevToolsApp } from '../core/app.js';
import { findGroup } from '../groups/find/index.js';
import { runGroup } from '../groups/run/index.js';
import { doctorGroup } from '../groups/doctor/index.js';
import { searchGroup } from '../groups/grep/index.js';
import { devGroup } from '../groups/dev/index.js';
import { browserGroup } from '../groups/browser/index.js';
import { mcpGroup } from '../groups/mcp/index.js';
import { buildProgram } from './adapter.js';
import { attachRenderer } from './renderer.js';

function findMonorepoRoot(from: string): string {
  let dir = from;
  while (true) {
    const pkgPath = path.join(dir, 'package.json');
    if (existsSync(pkgPath)) {
      try {
        const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
        if (pkg.workspaces) {
          return dir;
        }
      } catch {
        // ignore parse errors, keep walking
      }
    }
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  // Fallback to cwd
  return process.cwd();
}

async function readStdin(): Promise<string | undefined> {
  if (process.stdin.isTTY) return undefined;

  return new Promise((resolve) => {
    const chunks: Buffer[] = [];
    process.stdin.on('data', (chunk: Buffer) => chunks.push(chunk));
    process.stdin.on('end', () =>
      resolve(Buffer.concat(chunks).toString('utf-8').trim() || undefined),
    );
    // If stdin closes immediately (no data), resolve undefined
    process.stdin.on('error', () => resolve(undefined));
  });
}

export default async function main(): Promise<void> {
  const rootDir = findMonorepoRoot(process.cwd());
  const stdin = await readStdin();

  const app = new DevToolsApp(rootDir);

  // Register command groups
  app.register(findGroup);
  app.register(runGroup);
  app.register(doctorGroup);
  app.register(searchGroup);
  app.register(devGroup);
  app.register(browserGroup);
  app.register(mcpGroup);

  // Read version from package.json
  const pkgJsonPath = path.resolve(
    import.meta.dirname,
    '../../package.json',
  );
  let version = '0.1.0';
  try {
    const pkg = JSON.parse(readFileSync(pkgJsonPath, 'utf-8'));
    version = pkg.version ?? version;
  } catch {
    // use default
  }

  // Attach renderer with placeholder options (will be resolved after parse)
  const defaultOptions = {
    verbose: false,
    quiet: false,
    dryRun: false,
    nonInteractive: false,
  };
  attachRenderer(app, defaultOptions);

  // Build and parse
  const program = buildProgram(app, version, stdin);
  await program.parseAsync(process.argv);
}
