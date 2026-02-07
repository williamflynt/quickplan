import type { CommandContext, CommandResult } from '../../core/types.js';
export type LintIssue = {
    file: string;
    line: number;
    column: number;
    severity: 'error' | 'warning';
    message: string;
    rule: string;
};
export type LintResult = {
    package: string;
    files: number;
    errors: number;
    warnings: number;
    fixable: number;
    issues: LintIssue[];
};
export type LintData = {
    results: LintResult[];
    summary: {
        errors: number;
        warnings: number;
    };
};
declare function parseEslintJson(json: string, rootDir: string): {
    files: number;
    errors: number;
    warnings: number;
    fixable: number;
    issues: LintIssue[];
};
export { parseEslintJson };
export declare function executeLint(ctx: CommandContext, rawArgs: Record<string, unknown>): Promise<CommandResult<LintData>>;
