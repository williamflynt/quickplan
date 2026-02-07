import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { resolveWorkspace } from '../../core/workspace.js';
function parseEslintJson(json, rootDir) {
    let entries;
    try {
        entries = JSON.parse(json);
    }
    catch {
        return { files: 0, errors: 0, warnings: 0, fixable: 0, issues: [] };
    }
    const issues = [];
    let errors = 0;
    let warnings = 0;
    let fixable = 0;
    for (const entry of entries) {
        errors += entry.errorCount;
        warnings += entry.warningCount;
        fixable += entry.fixableErrorCount + entry.fixableWarningCount;
        for (const msg of entry.messages) {
            issues.push({
                file: path.relative(rootDir, entry.filePath),
                line: msg.line,
                column: msg.column,
                severity: msg.severity === 2 ? 'error' : 'warning',
                message: msg.message,
                rule: msg.ruleId ?? '',
            });
        }
    }
    return { files: entries.length, errors, warnings, fixable, issues };
}
export { parseEslintJson };
async function lintWorkspace(ctx, ws, fix) {
    const npxPath = path.join(path.dirname(process.execPath), 'npx');
    const binDir = path.dirname(process.execPath);
    const env = { ...process.env, PATH: `${binDir}:${process.env.PATH}` };
    const args = ['eslint', '--format', 'json', '--ext', 'ts,tsx'];
    if (fix)
        args.push('--fix');
    for (const sub of ['src', 'test']) {
        const dir = path.join(ws.dir, sub);
        if (existsSync(dir))
            args.push(dir);
    }
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
            // eslint exits 0 = clean, 1 = lint errors found, 2 = crash
            if (code === 2) {
                resolve({ ok: false, error: `eslint crashed: ${stderr}` });
                return;
            }
            const parsed = parseEslintJson(stdout, ctx.rootDir);
            resolve({
                package: ws.name,
                ...parsed,
            });
        });
        child.on('error', (err) => {
            resolve({ ok: false, error: `Failed to spawn eslint: ${err.message}` });
        });
    });
}
export async function executeLint(ctx, rawArgs) {
    const args = rawArgs;
    const fix = args.fix ?? false;
    let workspaces;
    try {
        workspaces = resolveWorkspace(ctx.rootDir, args.package);
    }
    catch (err) {
        return { ok: false, error: err instanceof Error ? err.message : String(err) };
    }
    const results = [];
    for (const ws of workspaces) {
        const result = await lintWorkspace(ctx, ws, fix);
        if ('ok' in result && result.ok === false) {
            return { ok: false, error: result.error };
        }
        results.push(result);
    }
    const summary = {
        errors: results.reduce((sum, r) => sum + r.errors, 0),
        warnings: results.reduce((sum, r) => sum + r.warnings, 0),
    };
    return { ok: true, data: { results, summary } };
}
//# sourceMappingURL=lint.js.map