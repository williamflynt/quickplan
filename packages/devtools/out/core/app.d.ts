import type { CommandGroup, CommandRegistryInterface, CommandResult, DevToolsAppInterface, DevToolsEventMap, GlobalOptions, LogLevel } from './types.js';
export declare class DevToolsApp implements DevToolsAppInterface {
    private emitter;
    private registry;
    readonly rootDir: string;
    readonly dataDir: string;
    constructor(rootDir: string, dataDir?: string);
    emit<K extends keyof DevToolsEventMap>(type: K, event: DevToolsEventMap[K]): void;
    on<K extends keyof DevToolsEventMap>(type: K, listener: (event: DevToolsEventMap[K]) => void): void;
    off<K extends keyof DevToolsEventMap>(type: K, listener: (event: DevToolsEventMap[K]) => void): void;
    log(level: LogLevel, message: string, data?: unknown): void;
    progress(group: string, command: string, message: string, current?: number, total?: number): void;
    register(group: CommandGroup): void;
    getRegistry(): CommandRegistryInterface;
    execute(groupName: string, commandName: string, args: Record<string, unknown>, options: GlobalOptions, stdin?: string): Promise<CommandResult>;
}
