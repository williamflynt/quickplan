# Project Flow Syntax (PFS) Reference

Project Flow Syntax is a domain-specific language (DSL) designed for quickly defining project plans with tasks, dependencies, resources, and milestones. It's optimized for rapid entry and supports PERT/CPM chart generation.

## Overview

Project Flow Syntax lets you describe projects using a concise, text-based format. It's designed to feel natural, like taking notes or mind-mapping, while maintaining the precision needed for project planning tools.

### File Extension

Project Flow Syntax files use the `.pfs` extension.

### Basic Concepts

- **Tasks** - Units of work to be completed
- **Dependencies** - Relationships showing which tasks must finish before others can start
- **Resources** - People or equipment assigned to tasks
- **Milestones** - Significant project events or deadlines
- **Clusters** - Logical groupings of tasks

## Quick Start Tutorial

### Your First Project

Let's create a simple project for making scrambled eggs:

```pfs
# Select ingredients
SelectEggs
SelectBowl
SelectWhisk

# Prepare
CrackEggs
WhiskEggs
PreheatPan

# Cook and serve
PourEggs
CookEggs
ServeEggs

# Define the sequence
SelectEggs, SelectBowl > CrackEggs
SelectWhisk > WhiskEggs
CrackEggs > WhiskEggs > PourEggs
PreheatPan > PourEggs > CookEggs > ServeEggs
```

### Adding Durations

Tasks can have duration estimates using three formats:

```pfs
# Quick notation: low, likely, high estimates
SelectEggs 1 1 2
CrackEggs 1 2 3
WhiskEggs 1 2

# Or using attributes
PreheatPan(duration: 3)
CookEggs(duration: 2)
ServeEggs(duration: 1)
```

### Adding Resources

Resources are people or equipment. They're prefixed with `$`:

```pfs
# Define a resource
$Chef(specialty: "breakfast")

# Assign resource to tasks
$Chef > ServeEggs, CookEggs
```

### Adding Milestones

Milestones mark important events. They're prefixed with `%`:

```pfs
%ReadyToServe(time: "8:00 AM")

ServeEggs > %ReadyToServe
```

## Language Reference

### Comments

```pfs
# This is a single-line comment

"""
This is a
multi-line comment
"""
```

### Tasks

Tasks are the fundamental building blocks. They represent work to be done.

#### Simple Task Definition

```pfs
TaskName
```

#### Task with Attributes

```pfs
TaskName(duration: 5, priority: high, owner: "Alice")
```

#### Quick Duration Notation

For rapid entry, you can specify durations directly after the task name:

```pfs
# Three-point estimate: low, likely, high
TaskName 2 5 8

# Two-point estimate: low, high
TaskName 2 8

# Single estimate (likely)
TaskName 5
```

You can also add a description:

```pfs
TaskName 2 5 8 "This is what the task does"
TaskName 5 "A simple task with one estimate"
```

#### Task Naming Rules

- Must start with a letter or underscore
- Can contain letters, numbers, underscores, dots, and hyphens
- Examples: `Task1`, `my_task`, `task.subtask`, `task-name`

### Resources

Resources represent people, equipment, or other assignable entities. They're prefixed with `$`.

```pfs
# Simple resource
$ResourceName

# Resource with attributes
$Alice(role: "Developer", rate: 100)
$BuildServer(type: "CI/CD", location: "cloud")
```

### Milestones

Milestones represent significant project events. They're prefixed with `%`.

```pfs
# Simple milestone
%MilestoneName

# Milestone with attributes
%ProjectKickoff(date: "2024-01-15")
%PhaseOneComplete(deliverables: "Design docs")
```

### Clusters

Clusters are logical groupings of tasks. They're prefixed with `@`.

```pfs
# Simple cluster
@ClusterName

# Cluster with members
@Development: DesignAPI, ImplementCore, Testing

# Empty cluster (members added later)
@Planning
```

### Dependencies

Dependencies show that one task must complete before another can start.

#### Basic Dependency Chain

```pfs
TaskA > TaskB
```

This means: TaskB depends on TaskA (TaskA must finish before TaskB starts).

#### Multiple Dependencies

```pfs
# TaskC depends on both TaskA and TaskB
TaskA, TaskB > TaskC

# TaskD and TaskE both depend on TaskC
TaskC > TaskD, TaskE
```

#### Long Chains

```pfs
# Each task depends on the previous one
TaskA > TaskB > TaskC > TaskD
```

#### Complex Dependencies

```pfs
# Multiple tasks flowing to multiple tasks
TaskA, TaskB > TaskC, TaskD
# This creates:
# - TaskA > TaskC
# - TaskA > TaskD
# - TaskB > TaskC
# - TaskB > TaskD
```

#### Removing Dependencies

Use `~>` to remove a dependency:

```pfs
# First add a dependency
TaskA > TaskB

# Later remove it
TaskA ~> TaskB
```

### Resource Assignment

Resources can be assigned to tasks in either direction:

```pfs
# Resource to tasks
$Alice > TaskA, TaskB

# Tasks to resource
TaskA, TaskB > $Alice
```

Both formats mean: Alice is assigned to TaskA and TaskB.

#### Removing Resource Assignments

```pfs
# Remove Alice from TaskA
$Alice ~> TaskA

# Or
TaskA ~> $Alice
```

### Operations

#### Split Task

Mark tasks as split points in the project flow:

```pfs
# Left split: task has no predecessors
* > TaskA

# Right split: task has no successors
TaskZ > *
```

#### Explode Task

Break a task into multiple subtasks:

```pfs
# Explode into a specific number of tasks
ImplementFeature ! 5
# Creates: ImplementFeature.1, ImplementFeature.2, etc.

# Explode into named tasks
Development ! Design, Code, Test
# Creates the named tasks and replaces Development
```

#### Implode Tasks

Combine multiple tasks into one:

```pfs
# Combine tasks
TaskA, TaskB, TaskC / CombinedTask
# Replaces TaskA, TaskB, TaskC with CombinedTask
```

#### Remove Entity

Delete a task, resource, milestone, or cluster:

```pfs
~TaskName
~$ResourceName
~%MilestoneName
~@ClusterName
```

## Complete Example

Here's a comprehensive example showing most features:

```pfs
# Web Application Development Project

# Define resources
$James(role: "Backend Developer")
$Carrie(role: "Frontend Developer")
$Juan(role: "DevOps Engineer")

# Planning phase
ProjectKickoff 1 "Initial team meeting"
RequirementsGathering 3 5 7 "Gather and document requirements"
ArchitectureDesign 2 4 6

@Planning: ProjectKickoff, RequirementsGathering, ArchitectureDesign

ProjectKickoff > RequirementsGathering > ArchitectureDesign

# Backend development
DesignAPI(duration: 2, priority: "high")
ImplementCore(duration: 5)
ImplementAuth(duration: 3)
BackendTesting(duration: 3)

@Backend: DesignAPI, ImplementCore, ImplementAuth, BackendTesting

DesignAPI > ImplementCore, ImplementAuth > BackendTesting
$James > DesignAPI, ImplementCore, ImplementAuth

# Frontend development
DesignUI 2 3 4
ImplementComponents 5 7 9
IntegrateAPI 3
FrontendTesting 3

@Frontend: DesignUI, ImplementComponents, IntegrateAPI, FrontendTesting

DesignUI > ImplementComponents > IntegrateAPI > FrontendTesting
$Carrie > DesignUI, ImplementComponents, IntegrateAPI, FrontendTesting

# Integration and deployment
SystemIntegration(duration: 4)
Deployment(duration: 1)

ArchitectureDesign > DesignAPI, DesignUI
BackendTesting, FrontendTesting > SystemIntegration
SystemIntegration > Deployment
$Juan > Deployment

# Milestones
%BackendComplete(date: "2024-10-01")
%FrontendComplete(date: "2024-10-01")
%LaunchDay(date: "2024-11-01")

BackendTesting > %BackendComplete
FrontendTesting > %FrontendComplete
Deployment > %LaunchDay

# Operations
Deployment ! 5
```

## Best Practices

### Naming Conventions

- Use **PascalCase** for tasks: `DesignDatabase`, `ImplementAuth`
- Use descriptive names that clearly indicate the work
- Keep names concise but meaningful

### Organizing Your Project File

1. **Comments first** - Start with project description
2. **Resources** - Define all people/equipment
3. **Task definitions** - Define tasks with attributes
4. **Clusters** - Group related tasks
5. **Dependencies** - Define execution order
6. **Assignments** - Assign resources to tasks
7. **Milestones** - Mark important events
8. **Operations** - Explode/implode/remove as needed

### Duration Estimates

- Use **three-point estimates** (low, likely, high) when uncertainty exists
- Use **single estimates** for well-understood tasks
- Be consistent with units (hours, days, weeks)
- Document your unit in a comment at the file start

### Dependencies

- Define dependencies after defining tasks
- Use chains for sequential work: `A > B > C`
- Group parallel work clearly with comments
- Avoid circular dependencies (the validator will catch these)

## Common Patterns

### Sequential Phases

```pfs
PhaseA > PhaseB > PhaseC > PhaseD
```

### Parallel Work Streams

```pfs
# Backend and Frontend can happen in parallel
Backend > Integration
Frontend > Integration
Integration > Launch
```

### Multiple Prerequisites

```pfs
# Design must be done before both implementation streams
Design > BackendImpl
Design > FrontendImpl

# Or more concisely:
Design > BackendImpl, FrontendImpl
```

### Gated by Milestone

```pfs
# Both streams must complete before milestone
BackendDone, FrontendDone > %ReadyToIntegrate
%ReadyToIntegrate > Integration
```

## Syntax Summary

| Element | Prefix | Example |
|---------|--------|---------|
| Task | none | `TaskName` |
| Resource | `$` | `$Alice` |
| Milestone | `%` | `%Complete` |
| Cluster | `@` | `@Phase1` |
| Comment | `#` | `# Comment` |
| Multi-line comment | `"""` | `""" Comment """` |
| Dependency | `>` | `A > B` |
| Remove dependency | `~>` | `A ~> B` |
| Remove entity | `~` | `~TaskName` |
| Explode | `!` | `Task ! 5` |
| Implode | `/` | `A, B / C` |
| Split (no predecessor) | `* >` | `* > Task` |
| Split (no successor) | `> *` | `Task > *` |

## Advanced Topics

### Cycle Detection

The language includes built-in cycle detection. If you create a circular dependency, you'll get an error:

```pfs
# This will cause an error
TaskA > TaskB > TaskC > TaskA
# Error: Cycle detected in dependency chain: TaskA > TaskB > TaskC > TaskA
```

### Dynamic Task Creation

Use explode to dynamically create tasks:

```pfs
# Create 10 testing tasks
Testing ! 10
# Creates: Testing.1, Testing.2, ..., Testing.10
```

### Iterative Refinement

You can define tasks initially, then add details later:

```pfs
# Initial definition
TaskA
TaskB
TaskC

# Add dependencies later
TaskA > TaskB > TaskC

# Add attributes later
TaskA(duration: 5, owner: "Alice")
TaskB(duration: 3)
```

## Next Steps

- Try the [Quick Start Guide](../getting-started/quickstart.md) to run your first project
- See example projects in the `packages/project-flow-syntax/samples/` directory
- Explore the [User Guide](../user-guide/overview.md) for using QuickPlan
- Learn about the [Architecture](../development/architecture.md) for extending the DSL
