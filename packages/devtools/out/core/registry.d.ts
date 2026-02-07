import type { CommandDefinition, CommandGroup, CommandRegistryInterface } from './types.js';
export declare class CommandRegistry implements CommandRegistryInterface {
    private groups;
    register(group: CommandGroup): void;
    getGroup(name: string): CommandGroup | undefined;
    getGroups(): CommandGroup[];
    getCommand(groupName: string, commandName: string): CommandDefinition | undefined;
}
