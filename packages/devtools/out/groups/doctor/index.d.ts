import type { CommandGroup } from '../../core/types.js';
export type DoctorCheck = {
    name: string;
    status: 'ok' | 'warn' | 'missing';
    detail: string;
    version?: string;
    path?: string;
};
export declare const doctorGroup: CommandGroup;
