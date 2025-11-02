# Working with Dependencies

Dependencies are the relationships between tasks that define the order in which work must be completed. This guide explains how to create and manage dependencies in QuickPlan.

## Understanding Dependencies

In project planning, a dependency exists when one task cannot start (or finish) until another task is complete. 

### Types of Dependencies

The most common dependency type is **Finish-to-Start (FS)**:
- Task B depends on Task A
- Task B cannot start until Task A finishes
- This is the default dependency type in QuickPlan

**Example:** You can't start "Testing" until "Development" is finished.

## Creating Dependencies

### Adding a Dependency

1. Identify the prerequisite task (the task that must be completed first)
2. Identify the dependent task (the task that waits)
3. Use the interface to link them:
   - Select the prerequisite task
   - Click "Add Dependency" or use the connection tool
   - Select the dependent task

The PERT chart will automatically update to show the relationship with an arrow from the prerequisite to the dependent task.

### Multiple Dependencies

A task can have multiple prerequisites:

**Example:**
- "Integration Testing" might depend on both:
  - "Backend Development"
  - "Frontend Development"

In this case, "Integration Testing" cannot start until both backend and frontend development are complete.

## Visualizing Dependencies

### Reading the Chart

In the PERT chart:
- **Arrows** show the direction of dependency (from prerequisite to dependent)
- **Task positions** are automatically arranged to show the flow
- **Critical path** tasks may be highlighted (tasks where delays affect the project timeline)

### Dependency Chains

When tasks are linked in sequence, you create a dependency chain:

```
Design → Development → Testing → Deployment
```

Each task depends on the previous one, creating a linear sequence.

### Parallel Work

Tasks without dependencies can be worked on simultaneously:

```
       ┌─ Frontend Dev ─┐
Start ─┤                ├─ Integration
       └─ Backend Dev ──┘
```

Both Frontend and Backend development can proceed in parallel.

## Managing Dependencies

### Removing Dependencies

To remove a dependency:

1. Select the dependency link (arrow) in the chart
2. Click "Delete" or use the remove tool
3. Confirm the deletion

### Circular Dependencies

!!! warning
    Avoid circular dependencies! If Task A depends on Task B, and Task B depends on Task A (directly or through other tasks), the project cannot progress.

QuickPlan may warn you if you try to create a circular dependency.

## Best Practices

### Keep It Simple

- Only add dependencies that truly exist
- Don't over-constrain your project with unnecessary dependencies
- Parallel work is faster than sequential work

### Document Assumptions

If a dependency is based on an assumption (e.g., "Testing depends on Development because testers need code"), make sure the assumption is valid.

### Review Regularly

As your project evolves:
- Verify that dependencies are still accurate
- Add new dependencies as you discover them
- Remove dependencies that are no longer relevant

## Understanding Impact

### Critical Path

Tasks on the critical path have no slack time. Any delay in these tasks delays the entire project. Dependencies create the critical path.

### Slack Time

Tasks not on the critical path may have slack (or float) - time they can be delayed without affecting the project end date.

## Next Steps

- Return to the [User Guide Overview](overview.md)
- Learn more about [Creating Projects](creating-projects.md)
