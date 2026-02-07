import { createInterface } from 'node:readline';
import { execFile } from 'node:child_process';
import { readFileSync, existsSync, mkdirSync, appendFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// ── JSON-RPC types ──────────────────────────────────────────────────

type JsonRpcRequest = {
  jsonrpc: '2.0';
  id?: number | string;
  method: string;
  params?: Record<string, unknown>;
};

type JsonRpcResponse = {
  jsonrpc: '2.0';
  id: number | string;
  result?: unknown;
  error?: { code: number; message: string; data?: unknown };
};

// ── Helpers ─────────────────────────────────────────────────────────

function findMonorepoRoot(from: string): string {
  let dir = from;
  while (true) {
    const pkgPath = path.join(dir, 'package.json');
    if (existsSync(pkgPath)) {
      try {
        const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
        if (pkg.workspaces) return dir;
      } catch { /* ignore */ }
    }
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return process.cwd();
}

function send(msg: JsonRpcResponse): void {
  const json = JSON.stringify(msg);
  process.stdout.write(json + '\n');
}

let logFile: string | undefined;

function initLog(): void {
  const logDir = path.join(os.homedir(), '.qpd', 'logs');
  mkdirSync(logDir, { recursive: true });
  logFile = path.join(logDir, 'mcp-server.log');
}

function log(message: string): void {
  const line = `${new Date().toISOString()} ${message}\n`;
  process.stderr.write(line);
  if (logFile) {
    try { appendFileSync(logFile, line); } catch { /* best-effort */ }
  }
}

const qpdBin = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..', '..', 'bin', 'qpd.js',
);

function spawnQpd(rootDir: string, argv: string[]): Promise<{ stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    const child = execFile(
      process.execPath,
      [qpdBin, '--quiet', '--noninteractive', ...argv],
      { cwd: rootDir, timeout: 120_000, maxBuffer: 10 * 1024 * 1024 },
      (err, stdout, stderr) => {
        if (err && !stdout && !stderr) {
          reject(err);
        } else {
          resolve({ stdout: stdout.toString(), stderr: stderr.toString() });
        }
      },
    );
    // Close stdin so the CLI's readStdin() resolves immediately
    child.stdin?.end();
  });
}

// ── Request handlers ────────────────────────────────────────────────

function handleInitialize(id: number | string): void {
  log('initialize');
  send({
    jsonrpc: '2.0',
    id,
    result: {
      protocolVersion: '2024-11-05',
      capabilities: { tools: {} },
      serverInfo: { name: 'qpd', version: '0.1.0' },
    },
  });
}

async function handleToolsList(id: number | string, rootDir: string): Promise<void> {
  log('tools/list');
  try {
    const { stdout } = await spawnQpd(rootDir, ['mcp', 'tools']);
    const tools = JSON.parse(stdout.trim());
    send({ jsonrpc: '2.0', id, result: { tools } });
  } catch (err) {
    log(`tools/list error: ${err instanceof Error ? err.message : String(err)}`);
    send({
      jsonrpc: '2.0',
      id,
      error: { code: -32603, message: err instanceof Error ? err.message : String(err) },
    });
  }
}

async function handleToolsCall(
  id: number | string,
  params: Record<string, unknown>,
  rootDir: string,
): Promise<void> {
  const name = params.name as string;
  const args = (params.arguments ?? {}) as Record<string, unknown>;
  log(`tools/call ${name}`);

  try {
    const { stdout, stderr } = await spawnQpd(rootDir, ['mcp', 'exec', name, JSON.stringify(args)]);

    let result;
    if (stdout.trim()) {
      result = { ok: true, data: JSON.parse(stdout.trim()) };
    } else if (stderr.trim()) {
      try {
        const parsed = JSON.parse(stderr.trim());
        result = { ok: false, error: parsed.error, details: parsed.details };
      } catch {
        result = { ok: false, error: stderr.trim() };
      }
    } else {
      result = { ok: true, data: null };
    }

    send({
      jsonrpc: '2.0',
      id,
      result: {
        content: [{ type: 'text', text: JSON.stringify(result) }],
        isError: !result.ok,
      },
    });
  } catch (err) {
    log(`tools/call ${name} error: ${err instanceof Error ? err.message : String(err)}`);
    send({
      jsonrpc: '2.0',
      id,
      result: {
        content: [{ type: 'text', text: JSON.stringify({ ok: false, error: err instanceof Error ? err.message : String(err) }) }],
        isError: true,
      },
    });
  }
}

// ── Main ────────────────────────────────────────────────────────────

export default function main(): void {
  const rootDir = findMonorepoRoot(process.cwd());
  initLog();
  log(`server started (pid ${process.pid}, root ${rootDir})`);
  const rl = createInterface({ input: process.stdin });

  rl.on('line', async (line) => {
    let req: JsonRpcRequest;
    try {
      req = JSON.parse(line);
    } catch {
      return;
    }

    if (req.id === undefined || req.id === null) {
      return;
    }

    try {
      switch (req.method) {
        case 'initialize':
          handleInitialize(req.id);
          break;
        case 'tools/list':
          await handleToolsList(req.id, rootDir);
          break;
        case 'tools/call':
          await handleToolsCall(req.id, req.params ?? {}, rootDir);
          break;
        default:
          send({
            jsonrpc: '2.0',
            id: req.id,
            error: { code: -32601, message: `Method not found: ${req.method}` },
          });
      }
    } catch (err) {
      send({
        jsonrpc: '2.0',
        id: req.id,
        error: {
          code: -32603,
          message: err instanceof Error ? err.message : String(err),
        },
      });
    }
  });

  rl.on('close', () => process.exit(0));
}

// Auto-start when imported as entry point
main();
