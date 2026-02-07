import type { CommandContext, CommandResult } from '../../core/types.js';
export type TestResult = {
    package: string;
    success: boolean;
    output: string;
};
export type TestData = {
    results: TestResult[];
};
export declare function executeTest(ctx: CommandContext, rawArgs: Record<string, unknown>): Promise<CommandResult<TestData>>;
