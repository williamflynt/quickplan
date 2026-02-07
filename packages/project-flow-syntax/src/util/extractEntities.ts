import {
    Attribute,
    Cluster as AstCluster,
    isAssignment,
    isCluster,
    isDependencyChain,
    isExplodeTask,
    isImplodeTask,
    isMilestone,
    isProject,
    isProjectConfig,
    isRemoveEntity,
    isResource,
    isSplitTask,
    isTask,
    Milestone as AstMilestone,
    Resource as AstResource,
    Task as AstTask,
} from "../language/generated/ast.js";
import {AstNode} from "langium";


/**
 * A snapshot of a Project, reflecting the existence and state of all entities after rolling up the PFS commands.
 */
export type CalendarConfigRaw = {
    startDate: string
    workdays?: string      // e.g. "m,t,w,th,f"
    holidays?: string      // comma-separated ISO dates
}

export type ProjectEntities = {
    tasks: Record<string, Task>,
    milestones: Record<string, Milestone>,
    resources: Record<string, Resource>,
    assignments: AssignmentIndex,
    clusters: Record<string, Cluster>,
    dependencies: DependencyIndex,
    calendarConfig?: CalendarConfigRaw,
}

/**
 * Extracts entities from a Project.
 * @param node
 * @param p
 * @param clock Logical clock for tracking operations and generating unique names.
 */
export const extractEntities = (node: AstNode, p?: ProjectEntities, clock: number = 0): ProjectEntities => {
    clock++;
    p = p || newProjectEntities();
    if (isProject(node)) {
        for (const line of node.lines) {
            p = extractEntities(line, p, clock);
            clock++;
        }
        return p
    }
    if (isProjectConfig(node)) {
        const attrs = mapAttrs(node.attributes);
        if (typeof attrs.startDate === 'string') {
            p.calendarConfig = {
                startDate: attrs.startDate,
                workdays: typeof attrs.workdays === 'string' ? attrs.workdays : undefined,
                holidays: typeof attrs.holidays === 'string' ? attrs.holidays : undefined,
            }
        }
        return p
    }
    if (isTask(node) || isResource(node) || isMilestone(node)) {
        getOrCreate(node, p)
        clock++;
        return p
    }
    if (isCluster(node)) {
        if (!p.clusters[node.name]) {
            p.clusters[node.name] = {name: node.name, items: new ClusterItems()};
            clock++;
        }
        for (const item of node.items) {
            p.clusters[node.name].items.add({name: item.name, type: item.$type, attributes: mapAttrs(item.attributes)});
            clock++;
        }
        return p
    }
    if (isDependencyChain(node)) {
        for (const entity of node.leftMost) {
            p = extractEntities(entity, p, clock);
            clock++;
        }
        let leftSide = node.leftMost
        for (const segment of node.segments) {
            const pairs = [];
            for (const right of segment.rightSide) {
                p = extractEntities(right, p, clock);
                clock++;
                for (const left of leftSide) {
                    pairs.push([getOrCreate(left, p), getOrCreate(right, p)]);
                    clock++;
                }
            }
            for (const pair of pairs) {
                if (segment.remove) {
                    p.dependencies.remove(pair[0], pair[1]);
                    clock++;
                    continue;
                }
                p.dependencies.add(pair[0], pair[1]);
                clock++;
            }
            leftSide = segment.rightSide
        }
        return p
    }
    if (isAssignment(node)) {
        const tasks = node.tasks.map(t => {
            clock++;
            return getOrCreate(t, p!)
        });
        const resources = node.resources.map(r => {
            clock++;
            return getOrCreate(r, p!)
        });
        for (const task of tasks) {
            for (const resource of resources) {
                if (node.remove) {
                    p.assignments.remove(resource, task);
                    clock++;
                    continue;
                }
                p.assignments.add(resource, task);
                clock++;
            }
        }
        return p
    }
    if (isSplitTask(node)) {
        const oldTask = getOrCreate(node.task, p)
        const newName = node.task.name + `-${++clock}`;
        p.tasks[newName] = {name: newName, type: node.task.$type, attributes: mapAttrs(node.task.attributes)};
        clock++;
        // Add incoming deps to left if left, outgoing if right
        // Remove from original task (depending also on side)
        // Add dep from original task to new task (right) or opposite (left)
        if (node.left) {
            for (const dep of p.dependencies.to(oldTask)) {
                p.dependencies.add(dep, p.tasks[newName]);
                p.dependencies.remove(dep, oldTask);
                clock++;
            }
            p.dependencies.add(p.tasks[newName], oldTask);
        } else {
            for (const dep of p.dependencies.from(oldTask)) {
                p.dependencies.add(p.tasks[newName], dep);
                p.dependencies.remove(oldTask, dep);
                clock++;
            }
            p.dependencies.add(oldTask, p.tasks[newName]);
        }
        return p
    }
    if (isRemoveEntity(node)) {
        return removeEntity(node.entity, p);
    }
    if (isExplodeTask(node)) {
        const oldTask = getOrCreate(node.task, p)
        if (node.count) {
            for (let i = 0; i < node.count; i++) {
                clock++
                const newName = node.task.name + `-${clock}`;
                p.tasks[newName] = {name: newName, type: node.task.$type, attributes: mapAttrs(node.task.attributes)};
                for (const dep of p.dependencies.to(oldTask)) {
                    p.dependencies.add(dep, p.tasks[newName]);
                    p.dependencies.remove(dep, oldTask);
                    clock++;
                }
                for (const dep of p.dependencies.from(oldTask)) {
                    p.dependencies.add(p.tasks[newName], dep);
                    p.dependencies.remove(oldTask, dep);
                    clock++;
                }
            }
        } else {
            for (const t of node.tasks) {
                const newTask = getOrCreate(t, p)
                clock++
                for (const dep of p.dependencies.to(oldTask)) {
                    p.dependencies.add(dep, newTask);
                    p.dependencies.remove(dep, oldTask);
                    clock++;
                }
                for (const dep of p.dependencies.from(oldTask)) {
                    p.dependencies.add(newTask, dep);
                    p.dependencies.remove(oldTask, dep);
                    clock++;
                }
            }
        }
        p = removeEntity(node.task, p)
        clock++
        return p
    }
    if (isImplodeTask(node)) {
        const newTask = getOrCreate(node.target, p)
        clock++
        for (const t of node.tasks) {
            for (const dep of p.dependencies.to(getOrCreate(t, p))) {
                p.dependencies.add(dep, newTask);
                clock++;
            }
            for (const dep of p.dependencies.from(getOrCreate(t, p))) {
                p.dependencies.add(newTask, dep);
                clock++;
            }
            p = removeEntity(t, p)
            clock++
        }

    }
    return p
}

const newProjectEntities = (): ProjectEntities => {
    return {
        tasks: {},
        milestones: {},
        resources: {},
        assignments: new AssignmentIndex(),
        clusters: {},
        dependencies: new DependencyIndex(),
    };
}


interface BaseEntity {
    type: string,
    name: string,
    attributes: Record<string, string | number>
}

type Task = BaseEntity;
type Milestone = BaseEntity;
type Resource = BaseEntity;

interface Cluster {
    name: string,
    items: ClusterItems,
}

class ClusterItems {
    private tasks: Set<Task> = new Set()
    private milestones: Set<Milestone> = new Set()

    public add(item: Task | Milestone): void {
        if (item.type === 'Task') {
            this.tasks.add(item)
        } else if (item.type === 'Milestone') {
            this.milestones.add(item)
        }
    }

    public remove(item: Task | Milestone): void {
        if (item.type === 'Task') {
            this.tasks.delete(item)
        } else if (item.type === 'Milestone') {
            this.milestones.delete(item)
        }
    }

    public toJSON(): Array<{type: string, name: string}> {
        const items: Array<{type: string, name: string}> = [];
        for (const task of this.tasks) {
            items.push({type: task.type, name: task.name});
        }
        for (const milestone of this.milestones) {
            items.push({type: milestone.type, name: milestone.name});
        }
        return items;
    }
}

type TypedNamed = { type: string, name: string }

type Relation = { source: TypedNamed, target: TypedNamed }

/**
 * RelationalIndex is a generic class that holds relationship records and indexes them by both source and target.
 * It allows for common set operations, like reading, checking existence, and adding/removing relationships.
 * S extends BaseEntity - Source entity type
 * T extends BaseEntity - Target entity type
 */
abstract class RelationalIndex<S extends BaseEntity, T extends BaseEntity> {
    // Using Maps with object references as keys instead of Record with string hashes
    protected sourceIndex = new Map<S, Set<T>>();
    protected targetIndex = new Map<T, Set<S>>();

    /**
     * isSourceAllowed checks whether this implementation allows the given source entity.
     */
    protected abstract isSourceAllowed(source: unknown): source is S;

    /**
     * isTargetAllowed checks whether this implementation allows the given target entity.
     */
    protected abstract isTargetAllowed(target: unknown): target is T;

    /**
     * add creates a relationship between the given source and target entities.
     * Returns any errors or null if okay.
     */
    public add(source: S, target: T): string[] | null {
        const errs = [];
        if (!this.isSourceAllowed(source)) {
            errs.push(`Source entity type not allowed.`);
        }
        if (!this.isTargetAllowed(target)) {
            errs.push(`Target entity type not allowed.`);
        }
        if (errs.length > 0) {
            return errs;
        }

        // Get or create the set of targets for this source.
        if (!this.sourceIndex.has(source)) {
            this.sourceIndex.set(source, new Set<T>());
        }
        this.sourceIndex.get(source)!.add(target);

        // Get or create the set of sources for this target.
        if (!this.targetIndex.has(target)) {
            this.targetIndex.set(target, new Set<S>());
        }
        this.targetIndex.get(target)!.add(source);

        return null;
    }

    /**
     * remove deletes a relationship between the given source and target entities.
     * Returns any errors or null if okay.
     */
    public remove(source: S, target: T): string[] | null {
        // Remove target from source's relationships.
        const sourceRelationships = this.sourceIndex.get(source);
        if (sourceRelationships) {
            sourceRelationships.delete(target);
        }

        // Remove source from target's relationships.
        const targetRelationships = this.targetIndex.get(target);
        if (targetRelationships) {
            targetRelationships.delete(source);
        }

        return null;
    }

    /**
     * removeAll deletes all relationships involving the given entity.
     */
    public removeAll(entity: S | T): void {
        if (this.isSourceAllowed(entity) && this.sourceIndex.has(entity)) {
            const sourceRelationships = this.sourceIndex.get(entity);
            for (const target of sourceRelationships!) {
                this.targetIndex.get(target)!.delete(entity);
            }
            this.sourceIndex.delete(entity);
        }
        if (this.isTargetAllowed(entity) && this.targetIndex.has(entity)) {
            const targetRelationships = this.targetIndex.get(entity);
            for (const source of targetRelationships!) {
                this.sourceIndex.get(source)!.delete(entity);
            }
            this.targetIndex.delete(entity);
        }
    }

    /**
     * getRelationshipsFromSource returns all target entities related to the given source entity.
     */
    public from(source: S): Set<T> {
        return this.sourceIndex.get(source) || new Set<T>();
    }

    /**
     * getRelationshipsToTarget returns all source entities related to the given target entity.
     */
    public to(target: T): Set<S> {
        return this.targetIndex.get(target) || new Set<S>();
    }

    /**
     * hasRelationship checks whether there is a relationship between the given source and target entities.
     */
    public has(source: S, target: T): boolean {
        const sourceRelationships = this.sourceIndex.get(source);
        return sourceRelationships ? sourceRelationships.has(target) : false;
    }

    toJSON() {
        return Array.from(this.sourceIndex.entries()).reduce<Relation[]>((acc, entry) => {
            return [...acc, ...Array.from(entry[1]).map((item) => {
                return {source: {type: entry[0].type, name: entry[0].name}, target: {type: item.type, name: item.name}}
            })]
        }, [])
    }
}

class AssignmentIndex extends RelationalIndex<Resource, Task> {
    protected isSourceAllowed = typeChecker<Resource>('Resource');
    protected isTargetAllowed = typeChecker<Task>('Task');
}

class DependencyIndex extends RelationalIndex<Task | Milestone, Task | Milestone> {
    protected isSourceAllowed = typeChecker<Task | Milestone>('Task', 'Milestone');
    protected isTargetAllowed = typeChecker<Task | Milestone>('Task', 'Milestone');
}

const typeChecker = <T>(...typeStrings: string[]): (entity: unknown) => entity is T => {
    return (entity: unknown): entity is T => {
        for (const typeString of typeStrings) {
            if (entity && typeof entity === 'object' && 'type' in entity && entity.type === typeString) {
                return true;
            }
        }
        return false;
    }
}

const mapAttrs = (attrs: Attribute[]): Record<string, string | number> => {
    const theMap: Record<string, string | number> = {};
    if (!attrs) {
        return theMap
    }
    for (const attr of attrs) {
        if (attr.value === "~") {
            delete theMap[attr.name];
            continue;
        }
        // STRING_VALUE terminal includes surrounding quotes — strip them
        const v = attr.value;
        theMap[attr.name] = typeof v === 'string' && v.length >= 2 && v.startsWith('"') && v.endsWith('"')
            ? v.slice(1, -1)
            : v;
    }
    return theMap
}

const mergeAttrs = (base: BaseEntity, attrs: Attribute[]): BaseEntity => {
    for (const attr of attrs) {
        if (attr.value === "~") {
            delete base.attributes[attr.name];
            continue;
        }
        base.attributes[attr.name] = attr.value;
    }
    return base
}

const removeEntity = (node: AstTask | AstMilestone | AstResource | AstCluster, p: ProjectEntities): ProjectEntities => {
    if (node.$type === 'Resource') {
        const resource = p.resources[node.name]
        if (!resource) {
            return p
        }
        p.assignments.removeAll(resource)
        delete p.resources[node.name]
    } else if (node.$type === 'Task') {
        const task = p.tasks[node.name]
        if (!task) {
            return p
        }
        p.assignments.removeAll(task)
        p.dependencies.removeAll(task)
        for (const [_, cluster] of Object.entries(p.clusters)) {
            cluster.items.remove(task)
        }
        delete p.tasks[node.name]
    } else if (node.$type === 'Milestone') {
        const milestone = p.milestones[node.name]
        if (!milestone) {
            return p
        }
        p.dependencies.removeAll(milestone)
        for (const [_, cluster] of Object.entries(p.clusters)) {
            cluster.items.remove(milestone)
        }
        delete p.milestones[node.name]
    } else if (node.$type === 'Cluster') {
        delete p.clusters[node.name]
    } else {
        throw new Error(`RemoveEntity not implemented for AST node type: '${node}'`);
    }
    return p
}

/**
 * getOrCreate returns an entity from the project, creating it if it doesn't exist, and merging attributes if it does.
 * @param node
 * @param p
 */
const getOrCreate = (node: AstTask | AstMilestone | AstResource, p: ProjectEntities): Task | Milestone | Resource => {
    if (node.$type === 'Resource') {
        if (!p.resources[node.name]) {
            p.resources[node.name] = {name: node.name, type: 'Resource', attributes: mapAttrs(node.attributes)};
        } else {
            p.resources[node.name] = mergeAttrs(p.resources[node.name], node.attributes);
        }
        return p.resources[node.name];
    }
    if (node.$type === 'Task') {
        if (!p.tasks[node.name]) {
            p.tasks[node.name] = {name: node.name, type: 'Task', attributes: mapAttrs(node.attributes)};
        } else {
            p.tasks[node.name] = mergeAttrs(p.tasks[node.name], node.attributes);
        }
        if (typeof node.durationLow === 'number') {
            p.tasks[node.name].attributes.durationLow = node.durationLow;
        }
        if (typeof node.durationLikely === 'number') {
            p.tasks[node.name].attributes.durationLikely = node.durationLikely;
        }
        if (typeof node.durationHigh === 'number') {
            p.tasks[node.name].attributes.durationHigh = node.durationHigh;
        }
        if (typeof node.description === 'string') {
            p.tasks[node.name].attributes.description = node.description;
        }
        return p.tasks[node.name];
    }
    if (node.$type === 'Milestone') {
        if (!p.milestones[node.name]) {
            p.milestones[node.name] = {name: node.name, type: 'Milestone', attributes: mapAttrs(node.attributes)};
        } else {
            p.milestones[node.name] = mergeAttrs(p.milestones[node.name], node.attributes);
        }
        return p.milestones[node.name];
    }
    throw new Error(`getOrCreate not implemented for AST node type: '${node}'`);
}