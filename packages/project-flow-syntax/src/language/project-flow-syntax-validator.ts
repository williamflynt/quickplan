import type { ValidationAcceptor, ValidationChecks } from 'langium'
import type {
  ProjectFlowSyntaxAstType,
  DependencyChain,
} from './generated/ast.js'
import type { ProjectFlowSyntaxServices } from './project-flow-syntax-module.js'

/**
 * Register custom validation checks.
 */
export function registerValidationChecks(services: ProjectFlowSyntaxServices) {
  const registry = services.validation.ValidationRegistry
  const validator = services.validation.ProjectFlowSyntaxValidator
  const checks: ValidationChecks<ProjectFlowSyntaxAstType> = {
    DependencyChain: validator.checkNoCycles,
  }
  registry.register(checks, validator)
}

/**
 * Implementation of custom validations.
 */
export class ProjectFlowSyntaxValidator {
  private dependencyNodes: Record<string, GraphNode> = {}

  resetDependencyNodes(): void {
    this.dependencyNodes = {}
  }

  checkNoCycles(chain: DependencyChain, accept: ValidationAcceptor): void {
    let leftMost = chain.leftMost
    for (const segment of chain.segments) {
      // CREATE NODES LEFT
      for (const left of leftMost) {
        const leftKey = GraphNode.nameFor(left)
        if (!this.dependencyNodes[leftKey]) {
          this.dependencyNodes[leftKey] = new GraphNode(left)
        }
      }

      // CREATE NODES RIGHT
      for (const right of segment.rightSide) {
        const rightKey = GraphNode.nameFor(right)
        if (!this.dependencyNodes[rightKey]) {
          this.dependencyNodes[rightKey] = new GraphNode(right)
        }
      }

      // HANDLE REMOVE DEPS
      if (segment.remove) {
        for (const left of leftMost) {
          const leftKey = GraphNode.nameFor(left)
          for (const right of segment.rightSide) {
            const rightKey = GraphNode.nameFor(right)
            this.dependencyNodes[leftKey].removeOutgoing(
              this.dependencyNodes[rightKey],
            )
          }
        }
        // Removing dependencies can't introduce cycles, so move on.
        leftMost = segment.rightSide
        continue
      }

      // ADD NEW DEPS - CHECK CYCLES FOR ROOTS
      for (let i = 0; i < segment.rightSide.length; i++) {
        const right = segment.rightSide[i]
        const rightKey = GraphNode.nameFor(right)

        for (const left of leftMost) {
          const leftKey = GraphNode.nameFor(left)

          // ADD
          this.dependencyNodes[leftKey].addOutgoing(
            this.dependencyNodes[rightKey],
          )

          // CHECK
          const sourceCycle = this.detectCycleFromSources()
          if (sourceCycle.length > 0) {
            const cycleStr = sourceCycle.join(' > ')
            accept('error', `Cycle detected in dependency chain: ${cycleStr}`, {
              node: segment,
              property: 'rightSide',
              index: i,
            })
          }
        }
      }
      leftMost = segment.rightSide
    }
  }

  /**
   * Detects cycles starting from source nodes (in-degree 0).
   * Returns the cycle path if found, empty array otherwise.
   */
  private detectCycleFromSources(): string[] {
    const sourceNodes = Object.values(this.dependencyNodes).filter(
      (node) => node.inDegree === 0,
    )

    // If there are no source nodes, but we have nodes, we have a cycle.
    if (
      sourceNodes.length === 0 &&
      Object.keys(this.dependencyNodes).length > 0
    ) {
      // Start from any node since we have a cycle.
      return this.findCycle(Object.values(this.dependencyNodes)[0])
    }

    // Check each source node.
    for (const source of sourceNodes) {
      const cycle = this.findCycle(source)
      if (cycle.length > 0) {
        return cycle
      }
    }

    return []
  }

  /**
   * Finds a cycle starting from the given node.
   * Uses DFS with visited tracking for efficiency.
   */
  private findCycle(start: GraphNode): string[] {
    const visited = new Set<string>()
    const onPath = new Set<string>()
    const path: string[] = []

    return this.dfs(start, visited, onPath, path)
  }

  private dfs(
    node: GraphNode,
    visited: Set<string>,
    onPath: Set<string>,
    path: string[],
  ): string[] {
    // Node already on current path - we found a cycle.
    if (onPath.has(node.name)) {
      const cycleStart = path.findIndex((n) => n === node.name)
      return path.slice(cycleStart).concat(node.name)
    }

    // Node already fully explored - no cycles from here.
    if (visited.has(node.name)) {
      return []
    }

    // Mark node as on current path.
    visited.add(node.name)
    onPath.add(node.name)
    path.push(node.name)

    // Check all outgoing edges.
    for (const outgoing of Object.values(node.outgoing)) {
      const cycle = this.dfs(outgoing, visited, onPath, path)
      if (cycle.length > 0) {
        return cycle
      }
    }

    // Remove from current path before backtracking.
    onPath.delete(node.name)
    path.pop()

    return []
  }
}

/**
 * Mirrors the AST structure for dependency chains.
 */
interface NamedTypedNode {
  $type: string
  name: string
}

/**
 * Doubly-linked graph node for cycle detection.
 */
class GraphNode {
  public outgoing: Record<string, GraphNode> = {}
  public incoming: Record<string, GraphNode> = {} // Track incoming edges

  constructor(public readonly named: NamedTypedNode) {}

  get name(): string {
    return GraphNode.nameFor(this.named)
  }

  get inDegree(): number {
    return Object.keys(this.incoming).length
  }

  static nameFor(node: NamedTypedNode): string {
    const sigil =
      node.$type === 'Task' ? '' : node.$type === 'Milestone' ? '%' : 'ERROR'
    if (sigil === 'ERROR') {
      throw new Error('Unexpected node type')
    }
    return `${sigil}::${node.name}`
  }

  addOutgoing(node: GraphNode): void {
    this.outgoing[node.name] = node
    node.incoming[this.name] = this
  }

  removeOutgoing(node: GraphNode): void {
    delete this.outgoing[node.name]
    delete node.incoming[this.name]
  }
}
