import { readdir } from 'node:fs/promises';
import path from 'node:path';
async function findFiles(ctx, rawArgs) {
    const args = rawArgs;
    const searchDir = args.cwd
        ? path.resolve(ctx.rootDir, args.cwd)
        : ctx.rootDir;
    let entries;
    try {
        entries = await readdir(searchDir, { recursive: true });
    }
    catch (err) {
        return {
            ok: false,
            error: `Failed to read directory: ${searchDir}`,
            details: err instanceof Error ? err.message : err,
        };
    }
    const matched = entries.filter((entry) => {
        // Match against the full relative path and the basename
        const basename = path.basename(entry);
        return (path.matchesGlob(entry, args.pattern) ||
            path.matchesGlob(basename, args.pattern));
    });
    // Sort for deterministic output
    matched.sort();
    const results = args.absolute
        ? matched.map((f) => path.resolve(searchDir, f))
        : matched;
    return { ok: true, data: results };
}
async function planFind(_ctx, rawArgs) {
    const args = rawArgs;
    return {
        steps: [
            {
                id: 'glob-search',
                description: `Recursively search for files matching "${args.pattern}"`,
                dependsOn: [],
            },
        ],
    };
}
export const findGroup = {
    name: 'find',
    description: 'Find files in the project',
    commands: [
        {
            name: 'find',
            description: 'Find files matching a glob pattern',
            args: ['<pattern>'],
            options: [
                {
                    flags: '-a, --absolute',
                    description: 'Output absolute paths instead of relative',
                },
                {
                    flags: '--cwd <dir>',
                    description: 'Search from a specific directory instead of root',
                },
            ],
            execute: findFiles,
            plan: planFind,
        },
    ],
};
//# sourceMappingURL=index.js.map