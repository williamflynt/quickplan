import type { CommandContext, CommandResult } from '../../core/types.js';
export type FormatResult = {
    package: string;
    files: string[];
};
export type FormatData = {
    results: FormatResult[];
};
export declare function executeFormat(ctx: CommandContext, rawArgs: Record<string, unknown>): Promise<CommandResult<FormatData>>;
