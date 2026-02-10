import type {
  CommandDefinition,
  CommandGroup,
  CommandRegistryInterface,
} from './types.js'

export class CommandRegistry implements CommandRegistryInterface {
  private groups = new Map<string, CommandGroup>()

  register(group: CommandGroup): void {
    if (this.groups.has(group.name)) {
      throw new Error(`Command group "${group.name}" is already registered`)
    }
    this.groups.set(group.name, group)
  }

  getGroup(name: string): CommandGroup | undefined {
    return this.groups.get(name)
  }

  getGroups(): CommandGroup[] {
    return [...this.groups.values()]
  }

  getCommand(
    groupName: string,
    commandName: string,
  ): CommandDefinition | undefined {
    const group = this.groups.get(groupName)
    if (!group) return undefined
    return group.commands.find((cmd) => cmd.name === commandName)
  }
}
