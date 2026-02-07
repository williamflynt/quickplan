import { describe, expect, it } from 'vitest';
import { DevToolsApp } from '../../src/core/app.js';
import { browserGroup } from '../../src/groups/browser/index.js';
import type { GlobalOptions } from '../../src/core/types.js';

const defaultOptions: GlobalOptions = {
  verbose: false,
  quiet: false,
  dryRun: false,
  nonInteractive: false,
};

describe('browser command group', () => {
  it('registers all commands', () => {
    const app = new DevToolsApp('/tmp');
    app.register(browserGroup);

    const group = app.getRegistry().getGroup('browser');
    expect(group).toBeDefined();
    expect(group!.commands.map((c) => c.name).sort()).toEqual([
      'click',
      'content',
      'eval',
      'logs',
      'navigate',
      'screenshot',
      'set-editor',
      'targets',
      'type',
      'wait',
    ]);
  });

  it('content returns plan in dry-run mode', async () => {
    const app = new DevToolsApp('/tmp');
    app.register(browserGroup);

    const result = await app.execute(
      'browser',
      'content',
      {},
      { ...defaultOptions, dryRun: true },
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      const data = result.data as { steps: { id: string }[] };
      expect(data.steps).toHaveLength(1);
    }
  });

  it('navigate returns plan in dry-run mode', async () => {
    const app = new DevToolsApp('/tmp');
    app.register(browserGroup);

    const result = await app.execute(
      'browser',
      'navigate',
      { url: 'http://localhost:5173' },
      { ...defaultOptions, dryRun: true },
    );

    expect(result.ok).toBe(true);
  });

  it('content fails gracefully when no browser is running', async () => {
    const app = new DevToolsApp('/tmp');
    app.register(browserGroup);

    const result = await app.execute(
      'browser',
      'content',
      { cdpPort: '19999' }, // unlikely to have anything here
      defaultOptions,
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBeTruthy();
    }
  }, 15_000);

  it('targets fails gracefully when no browser is running', async () => {
    const app = new DevToolsApp('/tmp');
    app.register(browserGroup);

    const result = await app.execute(
      'browser',
      'targets',
      { cdpPort: '19999' },
      defaultOptions,
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBeTruthy();
    }
  });

  it('eval returns plan in dry-run mode', async () => {
    const app = new DevToolsApp('/tmp');
    app.register(browserGroup);

    const result = await app.execute(
      'browser',
      'eval',
      { expression: '1 + 1' },
      { ...defaultOptions, dryRun: true },
    );

    expect(result.ok).toBe(true);
  });

  it('screenshot returns plan in dry-run mode', async () => {
    const app = new DevToolsApp('/tmp');
    app.register(browserGroup);

    const result = await app.execute(
      'browser',
      'screenshot',
      {},
      { ...defaultOptions, dryRun: true },
    );

    expect(result.ok).toBe(true);
  });
});
