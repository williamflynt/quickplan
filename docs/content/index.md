# QuickPlan Documentation

Welcome to the QuickPlan documentation!

![QuickPlan Screenshot](img/screenshot-small.png)

## What is QuickPlan?

QuickPlan is a web-based project planning tool that helps you create PERT charts quickly and interactively. It provides a visual way to plan projects, define dependencies between tasks, and understand the critical path.

### Simple Example

QuickPlan uses Project Flow Syntax (PFS), a concise language for defining projects:

```pfs
# Define tasks with duration estimates.
Design 2 3 5 "Design the system architecture"
Implement 5 8 12 "Build core features"
Test 2 3 4 "Test and fix issues"
Deploy 1 "Deploy to production"

# Define dependencies (what must finish before what can start).
Design > Implement > Test > Deploy

# Add resources.
$Alice(role: "Developer")
$Bob(role: "QA")

$Alice > Design, Implement
$Bob > Test

# Mark important milestones.
%LaunchDay(date: "2024-12-01")
Deploy > %LaunchDay
```

This creates a complete project plan with tasks, dependencies, resource assignments, and milestones.

## Key Features

- **Visual Planning** - Graphically design your project structure
- **Dependency Management** - Easily define and visualize task dependencies
- **PERT Charts** - Clear visualization of project flow and critical paths
- **Interactive** - Real-time updates as you modify your project
- **No Backend Required** - Everything runs in your browser

## Why QuickPlan?

PERT charts are often easier to understand than Gantt charts, especially when it comes to visualizing dependencies between tasks. However, most tools require you to prepare data in spreadsheets before creating the chart. QuickPlan lets you build your project plan interactively, making it faster to iterate on your project structure.

## Quick Links

- [Installation Guide](getting-started/installation.md) - Get QuickPlan up and running
- [Quick Start](getting-started/quickstart.md) - Create your first project
- [DSL Reference](reference/dsl.md) - Learn the Project Flow Syntax language
- [User Guide](user-guide/overview.md) - Learn how to use QuickPlan effectively
- [Contributing](development/contributing.md) - Help improve QuickPlan

## Get Started

Ready to start planning? Head over to the [Installation Guide](getting-started/installation.md) to get QuickPlan running on your machine.
