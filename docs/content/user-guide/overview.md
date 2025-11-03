# User Guide Overview

Welcome to the QuickPlan user guide! This section provides detailed information on how to use QuickPlan effectively for your project planning needs.

## What You'll Learn

This user guide covers:

- **Creating Projects** - How to write PFS code and manage your projects
- **Working with Dependencies** - Managing task relationships and constraints
- **Understanding the Interface** - Using the Monaco editor and PERT chart visualization
- **Storage and Files** - Auto-save, opening, and downloading projects
- **Best Practices** - Tips for effective project planning with QuickPlan

## Key Concepts

### Project Flow Syntax (PFS)

PFS is a text-based domain-specific language (DSL) for defining projects. Instead of clicking buttons and forms, you write code that describes your project structure. This provides:

- **Speed** - Type faster than clicking through UIs
- **Version control** - Text files work with Git
- **Clarity** - See your entire project structure at once
- **Reproducibility** - Easy to copy, share, and modify

### Tasks

Tasks are the fundamental building blocks of your project. Each task represents a unit of work with:

- A unique name or identifier
- Duration estimates (low, likely, high) for PERT calculations
- Optional description
- Optional dependencies on other tasks

### Dependencies

Dependencies define the relationships between tasks. When Task B depends on Task A, Task B cannot start until Task A is complete. Dependencies are expressed using the `>` operator:

```pfs
TaskA > TaskB > TaskC
```

### Resources

Resources represent people, equipment, or other assets assigned to tasks. Defined with the `$` prefix:

```pfs
$Alice(role: "Developer")
$Bob(role: "QA")

$Alice > Design, Implementation
$Bob > Testing
```

### Milestones

Milestones mark important project events or deliverables. Defined with the `%` prefix:

```pfs
%ProjectStart(date: "2024-01-01")
%LaunchDay(date: "2024-12-01")
```

### PERT Charts

Program Evaluation and Review Technique (PERT) charts are a visual representation of your project's tasks and their dependencies. They help you:

- Understand the sequence of work
- Identify parallel work streams
- Find the critical path
- Estimate project duration using three-point estimation

### Critical Path

The critical path is the longest sequence of dependent tasks that determines the minimum time needed to complete the project. Any delay in critical path tasks will delay the entire project. QuickPlan highlights the critical path in red.

## Getting Help

If you need help with specific features:

- Check the relevant sections in this user guide
- Review the [Quick Start](../getting-started/quickstart.md) guide
- Visit the project repository for issues and discussions

## Topics

- [Creating Projects](creating-projects.md)
- [Working with Dependencies](dependencies.md)
