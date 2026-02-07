import type { CommandContext, CommandResult } from '../../core/types.js';
export type BuildResult = {
    package: string;
    success: boolean;
    output: string;
};
export type BuildData = {
    results: BuildResult[];
};
export declare function executeBuild(ctx: CommandContext, rawArgs: Record<string, unknown>): Promise<CommandResult<BuildData>>;
