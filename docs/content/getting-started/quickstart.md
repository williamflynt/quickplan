# Quick Start

This guide will help you get QuickPlan running and create your first project plan.

## Starting the Development Server

After [installing QuickPlan](installation.md), start the development server:

```bash
npm run dev
```

The application will start and be available at `http://localhost:5173`.

Open your browser and navigate to this address.

## Understanding the Interface

When you first open QuickPlan, you'll see:

- **Left Panel** - Monaco editor with Project Flow Syntax (PFS) code
- **Right Panel** - PERT chart visualization
- **Bottom Toolbar** - File operations and storage status

The editor will contain a sample project that demonstrates the syntax.

## Your First Project

Let's create a simple software project from scratch.

### Step 1: Reset to Start Fresh

Click the **Reset** button in the toolbar to clear the sample and start with a blank editor.

### Step 2: Define Tasks

Type the following in the editor:

```pfs
# My First Project
Design 2 3 5 "Design the system architecture"
Implement 5 8 12 "Build core features"
Test 2 3 4 "Test and fix issues"
Deploy 1 "Deploy to production"
```

As you type, the PERT chart on the right will update to show your tasks.

### Step 3: Add Dependencies

Add dependencies to show the order of work:

```pfs
Design > Implement > Test > Deploy
```

The chart will rearrange to show the flow from left to right.

### Step 4: Add Resources

Define who will work on what:

```pfs
$Alice(role: "Developer")
$Bob(role: "QA")

$Alice > Design, Implement
$Bob > Test
```

### Step 5: Add a Milestone

Mark the completion milestone:

```pfs
%LaunchDay(date: "2024-12-01")
Deploy > %LaunchDay
```

### Complete Example

Your complete project should look like this:

```pfs
# My First Project
Design 2 3 5 "Design the system architecture"
Implement 5 8 12 "Build core features"  
Test 2 3 4 "Test and fix issues"
Deploy 1 "Deploy to production"

# Dependencies
Design > Implement > Test > Deploy

# Resources
$Alice(role: "Developer")
$Bob(role: "QA")

$Alice > Design, Implement
$Bob > Test

# Milestone
%LaunchDay(date: "2024-12-01")
Deploy > %LaunchDay
```

## Understanding the Results

The PERT chart now shows:

- **Task boxes** with duration estimates and CPM calculations
- **Arrows** showing dependencies between tasks
- **Critical path** highlighted in red (the longest path through the project)
- **Milestones** marked as diamond shapes

## Saving Your Work

Your project is automatically saved to browser storage every 2 seconds.

To save to a file:

1. Press **Ctrl/Cmd+S** (or click **Download**)
2. Choose where to save your `.pfs` file
3. The file can be opened later using **Ctrl/Cmd+O**

## Keyboard Shortcuts

- **Ctrl/Cmd+S** - Download project as `.pfs` file
- **Ctrl/Cmd+O** - Open a `.pfs` file from disk

## Next Steps

- Learn more about [Creating Projects](../user-guide/creating-projects.md)
- Understand [Working with Dependencies](../user-guide/dependencies.md)
- Explore the [User Guide](../user-guide/overview.md)
