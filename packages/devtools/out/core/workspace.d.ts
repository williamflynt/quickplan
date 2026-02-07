export type Workspace = {
    name: string;
    shortName: string;
    dir: string;
};
export declare function listWorkspaces(rootDir: string): Workspace[];
export declare function resolveWorkspace(rootDir: string, nameOrAll?: string): Workspace[];
