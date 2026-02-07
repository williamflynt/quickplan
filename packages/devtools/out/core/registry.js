export class CommandRegistry {
    groups = new Map();
    register(group) {
        if (this.groups.has(group.name)) {
            throw new Error(`Command group "${group.name}" is already registered`);
        }
        this.groups.set(group.name, group);
    }
    getGroup(name) {
        return this.groups.get(name);
    }
    getGroups() {
        return [...this.groups.values()];
    }
    getCommand(groupName, commandName) {
        const group = this.groups.get(groupName);
        if (!group)
            return undefined;
        return group.commands.find((cmd) => cmd.name === commandName);
    }
}
//# sourceMappingURL=registry.js.map