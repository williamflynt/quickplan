# quickplan

Faster PERT charts.

#### Contents

1. [Quickstart](#quickstart)
   * [Prerequisites](#prerequisites)
   * [Build and Run](#build-and-run)
2. [What and Why?](#what-and-why)
3. [Limitations](#limitations)
4. [Contributing](#contributing)

---

## Quickstart

This gets you up and running as quickly as possible.

### Prerequisites

You need Node/NPM installed on your machine to run the application.

### Build and Run

```shell
npm install
# Generate the language files.
cd packages/project-flow-syntax
npm run langium:generate
npm run build
npm run build:web
cd ../..
# Run the web app.
npm run dev
```

You should be able to visit `http://localhost:5173` in your browser.

## What and Why?

[![screenshot](./docs/content/img/screenshot-small.png)](./docs/content/img/screenshot.png)

This application helps you graphically, iteratively plan a project and visualize it on a PERT chart.
I find PERT charts easier to understand than Gantt charts, and dependencies are clearly visible.

But **why** make this at all?

I needed to plan a big project at work. I couldn't find any tools that would chart dependencies without requiring a pre-made spreadsheet. So I made this.

### Project Flow Syntax

QuickPlan uses a simple, text-based DSL called Project Flow Syntax (PFS) for defining projects:

```pfs
# Define tasks with duration estimates (low, likely, high)
Design 2 3 5 "Design the system architecture"
Implement 5 8 12 "Build core features"
Test 2 3 4 "Test and fix issues"
Deploy 1 "Deploy to production"

# Define dependencies
Design > Implement > Test > Deploy

# Add resources (people or equipment)
$Alice(role: "Developer")
$Bob(role: "QA")

# Assign resources to tasks
$Alice > Design, Implement
$Bob > Test

# Mark important milestones
%LaunchDay(date: "2024-12-01")
Deploy > %LaunchDay
```

This concise syntax creates a complete project plan with tasks, dependencies, resource assignments, and milestones. See the [full DSL documentation](docs/content/reference/dsl.md) for more details.

## Features

- **Text-based project definition** - Use Project Flow Syntax (PFS) to define your projects
- **Real-time visualization** - See your PERT chart update as you type
- **Browser storage** - Projects are automatically saved to IndexedDB
- **File system integration** - Open and save `.pfs` files to disk
- **Critical path highlighting** - Instantly identify your project's critical path
- **Monaco editor** - Professional code editing experience with syntax highlighting

## Storage and Project Management

QuickPlan uses browser-based IndexedDB storage to automatically save your work:

- **Auto-save** - Changes are saved to browser storage every 2 seconds after editing
- **Open files** - Load `.pfs` files from your file system (Ctrl/Cmd+O)
- **Download files** - Save your project as a `.pfs` file to disk (Ctrl/Cmd+S)
- **Reset** - Clear all saved projects from browser storage and start fresh

Your most recent project is automatically loaded when you open the application.

## Limitations

- No multi-project browser UI (only loads most recent project on startup)
- No backend server or cloud sync
- No collaborative editing features
- Limited to browser IndexedDB storage capacity

## Contributing

The project needs work - please feel free to submit your PR!
