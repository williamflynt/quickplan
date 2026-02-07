import { describe, expect, it } from 'vitest';
import { DevToolsApp } from '../../src/core/app.js';
import { findGroup } from '../../src/groups/find/index.js';
import { devGroup } from '../../src/groups/dev/index.js';
import { mcpGroup } from '../../src/groups/mcp/index.js';
import type { GlobalOptions } from '../../src/core/types.js';

const defaultOptions: GlobalOptions = {
  verbose: false,
  quiet: true,
  dryRun: false,
  nonInteractive: true,
};

function createApp(): DevToolsApp {
  const app = new DevToolsApp('/tmp');
  app.register(findGroup);
  app.register(devGroup);
  app.register(mcpGroup);
  return app;
}

describe('mcp tools', () => {
  it('returns tool definitions excluding the mcp group', async () => {
    const app = createApp();
    const result = await app.execute('mcp', 'tools', {}, defaultOptions);

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const tools = result.data as { name: string }[];
    const names = tools.map((t) => t.name);

    // Should include tools from registered groups
    expect(names).toContain('qpd_find');
    expect(names).toContain('qpd_dev_start');

    // Should NOT include mcp group tools
    expect(names.every((n) => !n.startsWith('qpd_mcp'))).toBe(true);
  });

  it('returns tools with inputSchema', async () => {
    const app = createApp();
    const result = await app.execute('mcp', 'tools', {}, defaultOptions);

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const tools = result.data as { name: string; inputSchema: unknown }[];
    for (const tool of tools) {
      expect(tool.inputSchema).toBeDefined();
    }
  });
});

describe('mcp exec', () => {
  it('resolves tool name and executes', async () => {
    const app = createApp();
    const result = await app.execute(
      'mcp',
      'exec',
      { tool: 'qpd_dev_status', argsJson: '{}' },
      defaultOptions,
    );

    expect(result.ok).toBe(true);
  });

  it('returns error for unknown tool', async () => {
    const app = createApp();
    const result = await app.execute(
      'mcp',
      'exec',
      { tool: 'qpd_nonexistent', argsJson: '{}' },
      defaultOptions,
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain('Unknown tool');
    }
  });

  it('returns error for invalid JSON args', async () => {
    const app = createApp();
    const result = await app.execute(
      'mcp',
      'exec',
      { tool: 'qpd_dev_status', argsJson: 'not-json' },
      defaultOptions,
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain('Invalid JSON');
    }
  });

  it('works without argsJson (defaults to empty object)', async () => {
    const app = createApp();
    const result = await app.execute(
      'mcp',
      'exec',
      { tool: 'qpd_dev_status' },
      defaultOptions,
    );

    expect(result.ok).toBe(true);
  });

  it('passes arguments through to the command', async () => {
    const app = createApp();
    // dev_status takes no args, but exercises the full path
    const result = await app.execute(
      'mcp',
      'exec',
      { tool: 'qpd_dev_status', argsJson: '{}' },
      defaultOptions,
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      // dev_status returns structured data with running/vite/chromium fields
      expect(result.data).toHaveProperty('running');
    }
  });
});
