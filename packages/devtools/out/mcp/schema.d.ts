import type { CommandDefinition, CommandGroup, CommandOption } from '../core/types.js';
export type JsonSchema = {
    type: 'object';
    properties: Record<string, {
        type: string;
        description?: string;
        items?: {
            type: string;
        };
    }>;
    required?: string[];
};
export type ToolDefinition = {
    name: string;
    description: string;
    inputSchema: JsonSchema;
};
/**
 * Derive the MCP tool name from a group and command.
 * Single-command groups where the command name matches the group name
 * collapse to `qpd_<group>`. Otherwise `qpd_<group>_<command>`.
 */
export declare function toolName(group: CommandGroup, cmd: CommandDefinition): string;
/**
 * Build a JSON Schema input_schema from a command's args and options.
 */
export declare function buildInputSchema(args?: string[], options?: CommandOption[]): JsonSchema;
/**
 * Generate MCP tool definitions from all registered command groups.
 */
export declare function buildToolDefinitions(groups: CommandGroup[]): ToolDefinition[];
