import { describe, expect, it, vi } from 'vitest';
import { DevToolsApp } from '../../src/core/app.js';
import type {
  CommandGroup,
  CommandResult,
  GlobalOptions,
} from '../../src/core/types.js';

const defaultOptions: GlobalOptions = {
  verbose: false,
  quiet: false,
  dryRun: false,
  nonInteractive: false,
};

function makeEchoGroup(): CommandGroup {
  return {
    name: 'echo',
    description: 'Echo group',
    commands: [
      {
        name: 'say',
        description: 'Echo back args',
        execute: async (_ctx, args) => ({
          ok: true as const,
          data: args,
        }),
        plan: async (_ctx, args) => ({
          steps: [
            {
              id: 'echo',
              description: `Would echo: ${JSON.stringify(args)}`,
              dependsOn: [],
            },
          ],
        }),
      },
    ],
  };
}

function makeFailGroup(): CommandGroup {
  return {
    name: 'fail',
    description: 'Failing group',
    commands: [
      {
        name: 'boom',
        description: 'Always fails',
        execute: async () => {
          throw new Error('kaboom');
        },
      },
    ],
  };
}

describe('DevToolsApp', () => {
  it('executes a command and returns result', async () => {
    const app = new DevToolsApp('/tmp');
    app.register(makeEchoGroup());

    const result = await app.execute(
      'echo',
      'say',
      { message: 'hello' },
      defaultOptions,
    );
    expect(result).toEqual({ ok: true, data: { message: 'hello' } });
  });

  it('returns error for unknown command', async () => {
    const app = new DevToolsApp('/tmp');
    const result = await app.execute(
      'nope',
      'nope',
      {},
      defaultOptions,
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain('Unknown command');
    }
  });

  it('emits command:start and command:end events', async () => {
    const app = new DevToolsApp('/tmp');
    app.register(makeEchoGroup());

    const startEvents: unknown[] = [];
    const endEvents: unknown[] = [];
    app.on('command:start', (e) => startEvents.push(e));
    app.on('command:end', (e) => endEvents.push(e));

    await app.execute('echo', 'say', { x: 1 }, defaultOptions);

    expect(startEvents).toHaveLength(1);
    expect(endEvents).toHaveLength(1);
  });

  it('emits command:error when execute throws', async () => {
    const app = new DevToolsApp('/tmp');
    app.register(makeFailGroup());

    const errorEvents: unknown[] = [];
    app.on('command:error', (e) => errorEvents.push(e));

    const result = await app.execute('fail', 'boom', {}, defaultOptions);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe('kaboom');
    }
    expect(errorEvents).toHaveLength(1);
  });

  it('calls plan() in dry-run mode', async () => {
    const app = new DevToolsApp('/tmp');
    app.register(makeEchoGroup());

    const planEvents: unknown[] = [];
    app.on('command:plan', (e) => planEvents.push(e));

    const result = await app.execute(
      'echo',
      'say',
      { message: 'test' },
      { ...defaultOptions, dryRun: true },
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toHaveProperty('steps');
    }
    expect(planEvents).toHaveLength(1);
  });

  it('falls through to execute when dry-run but no plan()', async () => {
    const app = new DevToolsApp('/tmp');
    app.register(makeFailGroup()); // no plan() on 'boom'

    const result = await app.execute(
      'fail',
      'boom',
      {},
      { ...defaultOptions, dryRun: true },
    );
    // Should have tried execute and caught the error
    expect(result.ok).toBe(false);
  });

  it('log() emits log events', () => {
    const app = new DevToolsApp('/tmp');
    const logs: unknown[] = [];
    app.on('log', (e) => logs.push(e));

    app.log('info', 'test message', { extra: true });

    expect(logs).toHaveLength(1);
  });

  it('off() removes listeners', () => {
    const app = new DevToolsApp('/tmp');
    const logs: unknown[] = [];
    const listener = (e: unknown) => logs.push(e);

    app.on('log', listener);
    app.log('info', 'first');
    app.off('log', listener);
    app.log('info', 'second');

    expect(logs).toHaveLength(1);
  });

  it('passes stdin to command context', async () => {
    const app = new DevToolsApp('/tmp');
    let receivedStdin: string | undefined;
    app.register({
      name: 'stdin-test',
      description: 'stdin test',
      commands: [
        {
          name: 'check',
          description: 'check stdin',
          execute: async (ctx) => {
            receivedStdin = ctx.stdin;
            return { ok: true, data: ctx.stdin };
          },
        },
      ],
    });

    await app.execute(
      'stdin-test',
      'check',
      {},
      defaultOptions,
      'piped input',
    );
    expect(receivedStdin).toBe('piped input');
  });
});
