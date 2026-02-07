// ── Global Options ──────────────────────────────────────────────────

export type GlobalOptions = {
  verbose: boolean;
  quiet: boolean;
  dryRun: boolean;
  nonInteractive: boolean;
};

// ── Command Context ────────────────────────────────────────────────

export type CommandContext = {
  app: DevToolsAppInterface;
  rootDir: string;
  /** Platform data directory (~/.qpd on Linux/macOS). */
  dataDir: string;
  options: GlobalOptions;
  /** stdin content when piped. undefined if TTY. */
  stdin?: string;
};

// ── Command Result ─────────────────────────────────────────────────

export type CommandResult<T = unknown> =
  | { ok: true; data: T }
  | { ok: false; error: string; details?: unknown };

// ── Plan DAG (for dry-run) ─────────────────────────────────────────

export type PlanStep = {
  id: string;
  description: string;
  dependsOn: string[];
};

export type CommandPlan = {
  steps: PlanStep[];
};

// ── Command & Group ────────────────────────────────────────────────

export type CommandOption = {
  flags: string;
  description: string;
  defaultValue?: unknown;
};

export type CommandDefinition<
  TArgs = Record<string, unknown>,
  TResult = unknown,
> = {
  name: string;
  description: string;
  args?: string[];
  options?: CommandOption[];
  execute: (ctx: CommandContext, args: TArgs) => Promise<CommandResult<TResult>>;
  plan?: (ctx: CommandContext, args: TArgs) => Promise<CommandPlan>;
};

export type CommandGroup = {
  name: string;
  description: string;
  commands: CommandDefinition[];
};

// ── Events ─────────────────────────────────────────────────────────

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export type DevToolsEventMap = {
  'command:start': {
    timestamp: number;
    group: string;
    command: string;
    args: Record<string, unknown>;
    dryRun: boolean;
  };
  'command:end': {
    timestamp: number;
    group: string;
    command: string;
    result: CommandResult;
    durationMs: number;
  };
  'command:error': {
    timestamp: number;
    group: string;
    command: string;
    error: string;
  };
  'command:plan': {
    timestamp: number;
    group: string;
    command: string;
    plan: CommandPlan;
  };
  log: {
    timestamp: number;
    level: LogLevel;
    message: string;
    data?: unknown;
  };
  progress: {
    timestamp: number;
    group: string;
    command: string;
    message: string;
    current?: number;
    total?: number;
  };
  'process:stdout': {
    timestamp: number;
    source: string;
    line: string;
  };
  'process:stderr': {
    timestamp: number;
    source: string;
    line: string;
  };
  'process:exit': {
    timestamp: number;
    source: string;
    exitCode: number | null;
    signal: string | null;
  };
};

// ── App Interface ──────────────────────────────────────────────────

export type DevToolsAppInterface = {
  emit<K extends keyof DevToolsEventMap>(
    type: K,
    event: DevToolsEventMap[K],
  ): void;
  on<K extends keyof DevToolsEventMap>(
    type: K,
    listener: (event: DevToolsEventMap[K]) => void,
  ): void;
  off<K extends keyof DevToolsEventMap>(
    type: K,
    listener: (event: DevToolsEventMap[K]) => void,
  ): void;
  log(level: LogLevel, message: string, data?: unknown): void;
  progress(
    group: string,
    command: string,
    message: string,
    current?: number,
    total?: number,
  ): void;
  getRegistry(): CommandRegistryInterface;
  execute(
    groupName: string,
    commandName: string,
    args: Record<string, unknown>,
    options: GlobalOptions,
    stdin?: string,
  ): Promise<CommandResult>;
};

// ── Registry Interface ─────────────────────────────────────────────

export type CommandRegistryInterface = {
  register(group: CommandGroup): void;
  getGroup(name: string): CommandGroup | undefined;
  getGroups(): CommandGroup[];
  getCommand(
    groupName: string,
    commandName: string,
  ): CommandDefinition | undefined;
};
