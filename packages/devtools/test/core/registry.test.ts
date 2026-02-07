import { describe, expect, it } from 'vitest';
import { CommandRegistry } from '../../src/core/registry.js';
import type { CommandGroup } from '../../src/core/types.js';

function makeGroup(name: string): CommandGroup {
  return {
    name,
    description: `The ${name} group`,
    commands: [
      {
        name: 'cmd1',
        description: 'First command',
        execute: async () => ({ ok: true, data: null }),
      },
      {
        name: 'cmd2',
        description: 'Second command',
        execute: async () => ({ ok: true, data: null }),
      },
    ],
  };
}

describe('CommandRegistry', () => {
  it('registers and retrieves a group', () => {
    const registry = new CommandRegistry();
    const group = makeGroup('test');
    registry.register(group);

    expect(registry.getGroup('test')).toBe(group);
  });

  it('returns undefined for unknown group', () => {
    const registry = new CommandRegistry();
    expect(registry.getGroup('nope')).toBeUndefined();
  });

  it('throws on duplicate group name', () => {
    const registry = new CommandRegistry();
    registry.register(makeGroup('dup'));
    expect(() => registry.register(makeGroup('dup'))).toThrow(
      'Command group "dup" is already registered',
    );
  });

  it('lists all registered groups', () => {
    const registry = new CommandRegistry();
    registry.register(makeGroup('a'));
    registry.register(makeGroup('b'));

    const groups = registry.getGroups();
    expect(groups).toHaveLength(2);
    expect(groups.map((g) => g.name)).toEqual(['a', 'b']);
  });

  it('retrieves a specific command by group and name', () => {
    const registry = new CommandRegistry();
    registry.register(makeGroup('grp'));

    const cmd = registry.getCommand('grp', 'cmd1');
    expect(cmd).toBeDefined();
    expect(cmd!.name).toBe('cmd1');
  });

  it('returns undefined for unknown command', () => {
    const registry = new CommandRegistry();
    registry.register(makeGroup('grp'));

    expect(registry.getCommand('grp', 'nope')).toBeUndefined();
    expect(registry.getCommand('nope', 'cmd1')).toBeUndefined();
  });
});
