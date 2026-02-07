import { type ChildProcess } from 'node:child_process';
import type { DevToolsAppInterface } from './types.js';
export interface ManagedProcess {
    id: string;
    pid: number | undefined;
    child: ChildProcess;
}
export interface SpawnOpts {
    cwd?: string;
    env?: NodeJS.ProcessEnv;
    detached?: boolean;
}
export declare class ProcessManager {
    private processes;
    private app;
    constructor(app: DevToolsAppInterface);
    spawn(id: string, command: string, args: string[], opts?: SpawnOpts): ManagedProcess;
    kill(id: string, signal?: NodeJS.Signals): Promise<void>;
    killAll(signal?: NodeJS.Signals): Promise<void>;
    get(id: string): ManagedProcess | undefined;
    isRunning(id: string): boolean;
    waitForExit(id: string): Promise<number | null>;
    waitForOutput(id: string, pattern: RegExp, timeoutMs?: number): Promise<string>;
}
