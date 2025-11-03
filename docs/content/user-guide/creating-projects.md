# Creating Projects

Learn how to create and manage projects in QuickPlan using Project Flow Syntax (PFS).

## Understanding the Interface

QuickPlan's interface consists of two main panels:

- **Left Panel: Monaco Editor** - Where you write your PFS code
- **Right Panel: PERT Chart** - Visual representation of your project
- **Bottom Toolbar** - File operations and storage indicators

## Starting a New Project

When you open QuickPlan, it automatically loads your most recent project from browser storage. If this is your first time, you'll see a sample project demonstrating the syntax.

### Creating a Fresh Project

To start with a blank project:

1. Click the **Reset** button in the toolbar
2. Confirm the action (this clears all saved projects)
3. Begin typing your project definition in the editor

The sample project demonstrates key syntax features and provides a template you can modify.

## Storage and Auto-Save

QuickPlan automatically saves your work to browser storage (IndexedDB):

- **Auto-save**: Changes are saved every 2 seconds after you stop typing
- **Browser indicator**: Shows green when saved, yellow while saving, gray when unsaved
- **Disk indicator**: Shows whether you've downloaded/synced to a file

### Storage Indicators

The toolbar shows two storage status indicators:

- **Browser**: Shows IndexedDB save status and last save time
- **Disk**: Shows file system sync status and last download time

## Working with Files

### Opening a File

Press **Ctrl/Cmd+O** or click the **Open** button to:

1. Select a `.pfs` file from your computer
2. The file content loads into the editor
3. The project is saved to browser storage
4. The PERT chart updates automatically

### Downloading/Saving a File

Press **Ctrl/Cmd+S** or click the **Download** button to:

1. Save your project as a `.pfs` file
2. Choose where to save (or browser will auto-download)
3. Both disk and browser indicators update

### Resetting Storage

Click the **Reset** button to:

1. Clear all projects from browser storage
2. Reset to the default sample project
3. Clear the PERT chart

!!! warning
    Resetting clears all saved projects from browser storage. This cannot be undone. Make sure to download any projects you want to keep first.

## Writing Your Project

### Basic Structure

A project consists of tasks, dependencies, resources, and milestones defined using PFS:

```pfs
# Define tasks
task_name 2 3 5 "Description of the task"

# Define dependencies  
task1 > task2 > task3

# Add resources
$ResourceName > task1, task2

# Mark milestones
task3 > %ProjectComplete
```

### Real-time Updates

As you type in the Monaco editor:

1. Syntax is validated in real-time
2. Errors are highlighted with red squiggles
3. The PERT chart updates automatically
4. Changes are auto-saved to browser storage

### Getting Help While Coding

The Monaco editor provides:

- **Syntax highlighting** - Different colors for tasks, resources, milestones
- **Auto-completion** - Suggestions as you type
- **Error detection** - Red squiggles show syntax errors
- **Hover information** - Hover over elements for details

## Next Steps

- Learn about [Working with Dependencies](dependencies.md)
- Explore the [User Guide Overview](overview.md)
