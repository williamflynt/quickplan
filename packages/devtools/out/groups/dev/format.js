import { spawn } from 'node:child_process';
import path from 'node:path';
import { resolveWorkspace } from '../../core/workspace.js';
async function formatWorkspace(ctx, ws, check) {
    const npxPath = path.join(path.dirname(process.execPath), 'npx');
    const binDir = path.dirname(process.execPath);
    const env = { ...process.env, PATH: `${binDir}:${process.env.PATH}` };
    const relDir = path.relative(ctx.rootDir, ws.dir);
    const glob = `${relDir}/src/**/*.{ts,tsx}`;
    const args = check
        ? ['prettier', '--check', '--list-different', glob]
        : ['prettier', '--write', glob];
    ctx.app.log('debug', `Running: npx ${args.join(' ')}`);
    return new Promise((resolve) => {
        const child = spawn(npxPath, args, {
            cwd: ctx.rootDir,
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
            // prettier --check exits 1 if files need formatting, that's not a crash
            if (code !== 0 && code !== 1) {
                resolve({ ok: false, error: `prettier failed (exit ${code}): ${stderr}` });
                return;
            }
            const files = stdout
                .split('\n')
                .map((line) => line.trim())
                .filter((line) => line.length > 0);
            resolve({ package: ws.name, files });
        });
        child.on('error', (err) => {
            resolve({ ok: false, error: `Failed to spawn prettier: ${err.message}` });
        });
    });
}
export async function executeFormat(ctx, rawArgs) {
    const args = rawArgs;
    const check = args.check ?? false;
    let workspaces;
    try {
        workspaces = resolveWorkspace(ctx.rootDir, args.package);
    }
    catch (err) {
        return { ok: false, error: err instanceof Error ? err.message : String(err) };
    }
    const results = [];
    for (const ws of workspaces) {
        const result = await formatWorkspace(ctx, ws, check);
        if ('ok' in result && result.ok === false) {
            return { ok: false, error: result.error };
        }
        results.push(result);
    }
    return { ok: true, data: { results } };
}
//# sourceMappingURL=format.js.map