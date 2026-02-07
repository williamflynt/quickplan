import type { CommandGroup } from '../../core/types.js';
export type SearchMatch = {
    file: string;
    line: number;
    column: number;
    text: string;
};
export declare const searchGroup: CommandGroup;
