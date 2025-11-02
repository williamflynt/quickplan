# Quick Start

This guide will help you get QuickPlan running and create your first project plan.

## Starting the Development Server

After [installing QuickPlan](installation.md), start the development server:

```bash
npm run dev
```

The application will start and be available at `http://localhost:5173`.

Open your browser and navigate to this address.

## Creating Your First Project

### Understanding the Interface

When you first open QuickPlan, you'll see:

- **Canvas Area** - The main area where your PERT chart will be displayed
- **Task Editor** - Where you define tasks and their properties
- **Dependency Controls** - Tools to connect tasks and define dependencies

### Adding Tasks

1. Click the "Add Task" button
2. Enter a task name
3. Define the estimated duration
4. Click "Save" or press Enter

### Creating Dependencies

To show that one task depends on another:

1. Select the first task (the prerequisite)
2. Click "Add Dependency"
3. Select the dependent task
4. The chart will automatically update to show the relationship

### Viewing the Critical Path

The critical path represents the sequence of tasks that determines the minimum time to complete the project. Tasks on the critical path are typically highlighted in the chart.

## Example Project

Here's a simple example to get started:

1. Create a task "Design" with duration 5 days
2. Create a task "Development" with duration 10 days
3. Create a task "Testing" with duration 3 days
4. Make "Development" depend on "Design"
5. Make "Testing" depend on "Development"

You should now see a linear PERT chart showing the flow: Design → Development → Testing

## Next Steps

- Learn more about [Creating Projects](../user-guide/creating-projects.md)
- Understand [Working with Dependencies](../user-guide/dependencies.md)
- Explore the [User Guide](../user-guide/overview.md)
