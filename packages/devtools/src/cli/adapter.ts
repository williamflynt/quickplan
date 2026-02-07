import { Command } from 'commander';
import type { DevToolsApp } from '../core/app.js';
import type { GlobalOptions } from '../core/types.js';

export function buildProgram(
  app: DevToolsApp,
  version: string,
  stdin?: string,
): Command {
  const program = new Command();
  program
    .name('qpd')
    .description('QuickPlan development tools')
    .version(version)
    .option('-v, --verbose', 'Extra detail in output', false)
    .option('-q, --quiet', 'Suppress non-essential output', false)
    .option('--dry-run', 'Show plan DAG, do not execute', false)
    .option('--noninteractive', 'Never prompt for input', false);

  for (const group of app.getRegistry().getGroups()) {
    // For groups with a single command whose name matches the group,
    // register as a top-level command (e.g. `qpd find` instead of `qpd find find`)
    if (
      group.commands.length === 1 &&
      group.commands[0].name === group.name
    ) {
      const cmd = group.commands[0];
      const sub = program
        .command(group.name)
        .description(cmd.description);

      if (cmd.args) {
        for (const arg of cmd.args) {
          sub.argument(arg);
        }
      }
      if (cmd.options) {
        for (const opt of cmd.options) {
          sub.option(
            opt.flags,
            opt.description,
            opt.defaultValue as string | boolean | undefined,
          );
        }
      }

      sub.action(async (...actionArgs: unknown[]) => {
        const globalOpts = getGlobalOptions(program);
        const cmdOpts = sub.opts();
        // Commander passes positional args first, then options object, then the Command
        const positional = actionArgs.slice(
          0,
          actionArgs.length - 2,
        ) as string[];
        const merged: Record<string, unknown> = { ...cmdOpts };
        if (cmd.args) {
          for (let i = 0; i < cmd.args.length; i++) {
            const argName = cmd.args[i]
              .replace(/[<>\[\]]/g, '')
              .replace(/\.\.\.$/, '');
            merged[argName] = positional[i];
          }
        }

        const result = await app.execute(
          group.name,
          cmd.name,
          merged,
          globalOpts,
          stdin,
        );
        if (!result.ok) {
          process.exitCode = 1;
        }
      });
    } else {
      // Multi-command group: create a command group
      const groupCmd = program
        .command(group.name)
        .description(group.description);

      for (const cmd of group.commands) {
        const sub = groupCmd
          .command(cmd.name)
          .description(cmd.description);

        if (cmd.args) {
          for (const arg of cmd.args) {
            sub.argument(arg);
          }
        }
        if (cmd.options) {
          for (const opt of cmd.options) {
            sub.option(
              opt.flags,
              opt.description,
              opt.defaultValue as string | boolean | undefined,
            );
          }
        }

        sub.action(async (...actionArgs: unknown[]) => {
          const globalOpts = getGlobalOptions(program);
          const cmdOpts = sub.opts();
          const positional = actionArgs.slice(
            0,
            actionArgs.length - 2,
          ) as string[];
          const merged: Record<string, unknown> = { ...cmdOpts };
          if (cmd.args) {
            for (let i = 0; i < cmd.args.length; i++) {
              const argName = cmd.args[i]
                .replace(/[<>\[\]]/g, '')
                .replace(/\.\.\.$/, '');
              merged[argName] = positional[i];
            }
          }

          const result = await app.execute(
            group.name,
            cmd.name,
            merged,
            globalOpts,
            stdin,
          );
          if (!result.ok) {
            process.exitCode = 1;
          }
        });
      }
    }
  }

  return program;
}

function getGlobalOptions(program: Command): GlobalOptions {
  const opts = program.opts();
  return {
    verbose: opts.verbose ?? false,
    quiet: opts.quiet ?? false,
    dryRun: opts.dryRun ?? false,
    nonInteractive: opts.noninteractive ?? false,
  };
}
