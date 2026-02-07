import { CpmError, CpmInput, CpmOutput } from './types.js';
export declare const runCpm: (taskList: CpmInput[]) => Promise<CpmOutput | CpmError>;
