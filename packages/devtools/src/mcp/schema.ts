import type { CommandDefinition, CommandGroup, CommandOption } from '../core/types.js';

export type JsonSchema = {
  type: 'object';
  properties: Record<string, { type: string; description?: string; items?: { type: string } }>;
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
export function toolName(group: CommandGroup, cmd: CommandDefinition): string {
  if (group.commands.length === 1 && group.commands[0].name === group.name) {
    return `qpd_${group.name}`;
  }
  return `qpd_${group.name}_${cmd.name}`;
}

/**
 * Parse a Commander option flags string into a name and type.
 * Examples:
 *   "-a, --absolute"        → { name: "absolute", type: "boolean" }
 *   "-p, --port <port>"     → { name: "port", type: "string" }
 *   "--no-browser"          → { name: "browser", type: "boolean" }
 *   "--cwd <dir>"           → { name: "cwd", type: "string" }
 */
function parseOptionFlags(flags: string): { name: string; type: 'string' | 'boolean' } {
  const hasValue = /<[^>]+>/.test(flags);
  // Find the long flag name: --some-name or --no-some-name
  const longMatch = flags.match(/--(?:no-)?([a-zA-Z][\w-]*)/);
  if (!longMatch) {
    // Fallback: use the whole flags string cleaned up
    return { name: flags.replace(/[^a-zA-Z0-9]/g, ''), type: hasValue ? 'string' : 'boolean' };
  }
  // Convert kebab-case to camelCase
  const name = longMatch[1].replace(/-([a-z])/g, (_, c) => c.toUpperCase());
  return { name, type: hasValue ? 'string' : 'boolean' };
}

/**
 * Parse a Commander argument string into a name, required flag, and variadic flag.
 * Examples:
 *   "<pattern>"   → { name: "pattern", required: true, variadic: false }
 *   "[package]"   → { name: "package", required: false, variadic: false }
 *   "[args...]"   → { name: "args", required: false, variadic: true }
 */
function parseArg(arg: string): { name: string; required: boolean; variadic: boolean } {
  const required = arg.startsWith('<');
  const inner = arg.replace(/[<>\[\]]/g, '');
  const variadic = inner.endsWith('...');
  const name = inner.replace(/\.\.\.$/, '');
  return { name, required, variadic };
}

/**
 * Build a JSON Schema input_schema from a command's args and options.
 */
export function buildInputSchema(args?: string[], options?: CommandOption[]): JsonSchema {
  const properties: JsonSchema['properties'] = {};
  const required: string[] = [];

  if (args) {
    for (const arg of args) {
      const parsed = parseArg(arg);
      if (parsed.variadic) {
        properties[parsed.name] = { type: 'array', items: { type: 'string' } };
      } else {
        properties[parsed.name] = { type: 'string' };
      }
      if (parsed.required) {
        required.push(parsed.name);
      }
    }
  }

  if (options) {
    for (const opt of options) {
      const parsed = parseOptionFlags(opt.flags);
      properties[parsed.name] = { type: parsed.type, description: opt.description };
    }
  }

  const schema: JsonSchema = { type: 'object', properties };
  if (required.length > 0) {
    schema.required = required;
  }
  return schema;
}

/**
 * Generate MCP tool definitions from all registered command groups.
 */
export function buildToolDefinitions(groups: CommandGroup[]): ToolDefinition[] {
  const tools: ToolDefinition[] = [];
  for (const group of groups) {
    for (const cmd of group.commands) {
      tools.push({
        name: toolName(group, cmd),
        description: cmd.description,
        inputSchema: buildInputSchema(cmd.args, cmd.options),
      });
    }
  }
  return tools;
}
