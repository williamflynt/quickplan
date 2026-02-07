import { spawn } from 'node:child_process';
import path from 'node:path';
import { resolveWorkspace } from '../../core/workspace.js';
async function buildWorkspace(ctx, ws) {
    const npxPath = path.join(path.dirname(process.execPath), 'npx');
    const binDir = path.dirname(process.execPath);
    const env = { ...process.env, PATH: `${binDir}:${process.env.PATH}` };
    const args = ['tsc', '-b', 'tsconfig.json'];
    ctx.app.log('debug', `Running: npx ${args.join(' ')} in ${ws.dir}`);
    return new Promise((resolve) => {
        const child = spawn(npxPath, args, {
            cwd: ws.dir,
            env,
            stdio: ['pipe', 'pipe', 'pipe'],
        });
        const stdoutChunks = [];
        const stderrChunks = [];
        child.stdout.on('data', (chunk) => stdoutChunks.push(chunk));
        child.stderr.on('data', (chunk) => stderrChunks.push(chunk));
        child.on('close', (code) => {
            const stdout = Buffer.concat(stdoutChunks).toString('utf-8');
            const stderr = Buffer.concat(stderrChunks).toString('utf-8');
            const output = (stdout + stderr).trim();
            resolve({
                package: ws.name,
                success: code === 0,
                output,
            });
        });
        child.on('error', (err) => {
            resolve({ ok: false, error: `Failed to spawn tsc: ${err.message}` });
        });
    });
}
export async function executeBuild(ctx, rawArgs) {
    const args = rawArgs;
    let workspaces;
    try {
        workspaces = resolveWorkspace(ctx.rootDir, args.package);
    }
    catch (err) {
        return { ok: false, error: err instanceof Error ? err.message : String(err) };
    }
    const results = [];
    for (const ws of workspaces) {
        const result = await buildWorkspace(ctx, ws);
        if ('ok' in result && result.ok === false) {
            return { ok: false, error: result.error };
        }
        results.push(result);
    }
    return { ok: true, data: { results } };
}
//# sourceMappingURL=build.js.map