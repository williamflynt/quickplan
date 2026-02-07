import { spawn } from 'node:child_process';
import { createInterface } from 'node:readline';
import { existsSync, readFileSync, createReadStream } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildToolDefinitions, toolName } from '../../mcp/schema.js';
function spawnMcpServer(rootDir) {
    const scriptPath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..', 'bin', 'qpd-mcp.js');
    const child = spawn(process.execPath, [scriptPath], {
        cwd: rootDir,
        stdio: ['pipe', 'pipe', 'pipe'],
    });
    const rl = createInterface({ input: child.stdout });
    const pending = new Map();
    rl.on('line', (line) => {
        try {
            const msg = JSON.parse(line);
            const waiter = pending.get(msg.id);
            if (waiter) {
                pending.delete(msg.id);
                waiter.resolve(msg);
            }
        }
        catch { /* ignore non-JSON lines */ }
    });
    let nextId = 1;
    return {
        request(method, params) {
            const id = nextId++;
            const msg = JSON.stringify({ jsonrpc: '2.0', id, method, params });
            child.stdin.write(msg + '\n');
            return new Promise((resolve, reject) => {
                pending.set(id, { resolve, reject });
                setTimeout(() => {
                    if (pending.delete(id)) {
                        reject(new Error(`Timeout waiting for response to ${method}`));
                    }
                }, 10_000);
            });
        },
        notify(method, params) {
            const msg = JSON.stringify({ jsonrpc: '2.0', method, params });
            child.stdin.write(msg + '\n');
        },
        close() {
            child.stdin.end();
            child.kill();
        },
    };
}
async function initHandshake(client) {
    const initResp = await client.request('initialize', {
        protocolVersion: '2024-11-05',
        capabilities: {},
        clientInfo: { name: 'qpd-mcp-test', version: '0.1.0' },
    });
    client.notify('notifications/initialized');
    return initResp;
}
async function executeTest(ctx) {
    const client = spawnMcpServer(ctx.rootDir);
    try {
        const initResp = await initHandshake(client);
        const serverInfo = initResp.result?.serverInfo;
        const listResp = await client.request('tools/list');
        const tools = listResp.result?.tools ?? [];
        const toolNames = tools.map((t) => t.name).sort();
        // Sample call: dev status (safe, read-only)
        let sampleCall;
        if (toolNames.includes('qpd_dev_status')) {
            const callResp = await client.request('tools/call', {
                name: 'qpd_dev_status',
                arguments: {},
            });
            sampleCall = {
                tool: 'qpd_dev_status',
                response: callResp.result ?? callResp.error,
            };
        }
        return {
            ok: true,
            data: {
                serverInfo,
                toolCount: tools.length,
                tools: toolNames,
                sampleCall,
            },
        };
    }
    catch (err) {
        return { ok: false, error: err instanceof Error ? err.message : String(err) };
    }
    finally {
        client.close();
    }
}
async function executeCall(ctx, rawArgs) {
    const args = rawArgs;
    let toolArgs = {};
    if (args.args) {
        try {
            toolArgs = JSON.parse(args.args);
        }
        catch {
            return { ok: false, error: `Invalid JSON for tool arguments: ${args.args}` };
        }
    }
    const client = spawnMcpServer(ctx.rootDir);
    try {
        await initHandshake(client);
        const resp = await client.request('tools/call', {
            name: args.tool,
            arguments: toolArgs,
        });
        if (resp.error) {
            return { ok: false, error: resp.error.message, details: resp.error };
        }
        return { ok: true, data: resp.result };
    }
    catch (err) {
        return { ok: false, error: err instanceof Error ? err.message : String(err) };
    }
    finally {
        client.close();
    }
}
// ── tools command ─────────────────────────────────────────────────────
async function executeTools(ctx) {
    const groups = ctx.app
        .getRegistry()
        .getGroups()
        .filter((g) => g.name !== 'mcp');
    return { ok: true, data: buildToolDefinitions(groups) };
}
async function executeExec(ctx, rawArgs) {
    const args = rawArgs;
    let toolArgs = {};
    if (args.argsJson) {
        try {
            toolArgs = JSON.parse(args.argsJson);
        }
        catch {
            return { ok: false, error: `Invalid JSON: ${args.argsJson}` };
        }
    }
    // Build lookup from MCP tool name → (groupName, commandName)
    const groups = ctx.app
        .getRegistry()
        .getGroups()
        .filter((g) => g.name !== 'mcp');
    for (const group of groups) {
        for (const cmd of group.commands) {
            if (toolName(group, cmd) === args.tool) {
                // Call execute() directly to avoid double event emission —
                // app.execute() would fire command:start/end for the inner command,
                // and the outer `mcp exec` also fires its own, causing duplicate output.
                return cmd.execute(ctx, toolArgs);
            }
        }
    }
    return { ok: false, error: `Unknown tool: ${args.tool}` };
}
// ── logs command ──────────────────────────────────────────────────────
const MCP_LOG_FILE = 'logs/mcp-server.log';
async function executeMcpLogs(ctx, rawArgs) {
    const args = rawArgs;
    const logPath = path.join(ctx.dataDir, MCP_LOG_FILE);
    if (!existsSync(logPath)) {
        return { ok: false, error: 'No MCP server log found. Has the server been started?' };
    }
    const lines = parseInt(args.lines ?? '50', 10);
    const follow = ctx.options.nonInteractive ? false : (args.follow !== false);
    const content = readFileSync(logPath, 'utf-8');
    const allLines = content.split('\n');
    const tail = allLines.slice(-lines).join('\n');
    if (!follow) {
        return { ok: true, data: { logFile: logPath, output: tail } };
    }
    process.stdout.write(tail + '\n');
    return new Promise((resolve) => {
        const rl = createInterface({
            input: createReadStream(logPath, { start: Buffer.byteLength(content), encoding: 'utf-8' }),
        });
        rl.on('line', (line) => {
            process.stdout.write(line + '\n');
        });
        const shutdown = () => {
            rl.close();
            resolve({ ok: true, data: { logFile: logPath } });
        };
        process.on('SIGINT', shutdown);
        process.on('SIGTERM', shutdown);
    });
}
// ── Group definition ──────────────────────────────────────────────────
export const mcpGroup = {
    name: 'mcp',
    description: 'Test and interact with the MCP server',
    commands: [
        {
            name: 'test',
            description: 'Smoke-test the MCP server: initialize, list tools, and make a sample call',
            execute: executeTest,
        },
        {
            name: 'call',
            description: 'Call a tool through the MCP server',
            args: ['<tool>', '[args]'],
            execute: executeCall,
        },
        {
            name: 'tools',
            description: 'Output MCP tool definitions as JSON',
            execute: executeTools,
        },
        {
            name: 'exec',
            description: 'Execute a tool by its MCP name',
            args: ['<tool>', '[argsJson]'],
            execute: executeExec,
        },
        {
            name: 'logs',
            description: 'View MCP server logs',
            options: [
                {
                    flags: '-f, --follow',
                    description: 'Follow log output (default: true)',
                    defaultValue: true,
                },
                {
                    flags: '-n, --lines <count>',
                    description: 'Number of lines to show',
                    defaultValue: '50',
                },
            ],
            execute: executeMcpLogs,
        },
    ],
};
//# sourceMappingURL=index.js.map