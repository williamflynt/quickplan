import { spawn } from 'node:child_process';
import path from 'node:path';
function resolveBinary(tool) {
    const binDir = path.dirname(process.execPath);
    switch (tool) {
        case 'node':
            return process.execPath;
        case 'npm':
        case 'npx':
            return path.join(binDir, tool);
        default:
            throw new Error(`Unknown tool: ${tool}. Expected: node, npm, npx`);
    }
}
async function executeRun(ctx, rawArgs) {
    const args = rawArgs;
    const tool = args.tool;
    const toolArgs = args.args ?? [];
    let binaryPath;
    try {
        binaryPath = resolveBinary(tool);
    }
    catch (err) {
        return {
            ok: false,
            error: err instanceof Error ? err.message : String(err),
        };
    }
    const binDir = path.dirname(process.execPath);
    const env = { ...process.env, PATH: `${binDir}:${process.env.PATH}` };
    const isTTY = process.stdout.isTTY ?? false;
    ctx.app.log('debug', `Running: ${binaryPath} ${toolArgs.join(' ')}`);
    return new Promise((resolve) => {
        const child = spawn(binaryPath, toolArgs, {
            cwd: ctx.rootDir,
            env,
            stdio: isTTY ? 'inherit' : ['pipe', 'pipe', 'pipe'],
        });
        if (!isTTY) {
            const stdoutChunks = [];
            const stderrChunks = [];
            child.stdout?.on('data', (chunk) => stdoutChunks.push(chunk));
            child.stderr?.on('data', (chunk) => stderrChunks.push(chunk));
            child.on('close', (code) => {
                resolve({
                    ok: true,
                    data: {
                        exitCode: code ?? 1,
                        command: `${tool} ${toolArgs.join(' ')}`.trim(),
                        stdout: Buffer.concat(stdoutChunks).toString('utf-8'),
                        stderr: Buffer.concat(stderrChunks).toString('utf-8'),
                    },
                });
            });
        }
        else {
            child.on('close', (code) => {
                resolve({
                    ok: true,
                    data: {
                        exitCode: code ?? 1,
                        command: `${tool} ${toolArgs.join(' ')}`.trim(),
                    },
                });
            });
        }
        child.on('error', (err) => {
            resolve({
                ok: false,
                error: `Failed to spawn ${tool}: ${err.message}`,
            });
        });
    });
}
async function planRun(_ctx, rawArgs) {
    const args = rawArgs;
    return {
        steps: [
            {
                id: 'run',
                description: `Run ${args.tool} ${(args.args ?? []).join(' ')}`.trim(),
                dependsOn: [],
            },
        ],
    };
}
export const runGroup = {
    name: 'run',
    description: 'Run Node.js toolchain commands',
    commands: [
        {
            name: 'node',
            description: 'Run node with the discovered Node.js',
            args: ['[args...]'],
            execute: async (ctx, rawArgs) => executeRun(ctx, { ...rawArgs, tool: 'node' }),
            plan: async (ctx, rawArgs) => planRun(ctx, { ...rawArgs, tool: 'node' }),
        },
        {
            name: 'npm',
            description: 'Run npm with the discovered Node.js',
            args: ['[args...]'],
            execute: async (ctx, rawArgs) => executeRun(ctx, { ...rawArgs, tool: 'npm' }),
            plan: async (ctx, rawArgs) => planRun(ctx, { ...rawArgs, tool: 'npm' }),
        },
        {
            name: 'npx',
            description: 'Run npx with the discovered Node.js',
            args: ['[args...]'],
            execute: async (ctx, rawArgs) => executeRun(ctx, { ...rawArgs, tool: 'npx' }),
            plan: async (ctx, rawArgs) => planRun(ctx, { ...rawArgs, tool: 'npx' }),
        },
    ],
};
//# sourceMappingURL=index.js.map