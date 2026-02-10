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

## Quickstart and DevTools

```shell
node packages/devtools/bin/build-install.js
qpd dev start
```

This gets you up and running as quickly as possible, using the builtin `qpd` tool and MCP server.

### qpd Priority

This project has a custom CLI tool **`qpd`** exposed as both MCP tools and a Bash command.
Always prefer MCP tools (`mcp__qpd__*`) first, `qpd` via Bash second.

**Never use these raw commands directly:**
`npm run build`, `npx tsc`, `npx vitest`, `npx eslint`, `npx prettier`

### Dev Workflow Commands

| Task                                      | MCP tool                | Bash fallback           |
|-------------------------------------------|-------------------------|-------------------------|
| Build a package                           | `qpd_dev_build`         | `qpd dev build <pkg>`   |
| Run tests                                 | `qpd_dev_test`          | `qpd dev test <pkg>`    |
| Lint (+ auto-fix)                         | `qpd_dev_lint`          | `qpd dev lint <pkg>`    |
| Format                                    | `qpd_dev_format`        | `qpd dev format <pkg>`  |
| Start dev server + Chromium               | `qpd_dev_start`         | `qpd dev start`         |
| Stop dev server                           | `qpd_dev_stop`          | `qpd dev stop`          |
| Dev server status                         | `qpd_dev_status`        | `qpd dev status`        |
| Dev server logs                           | `qpd_dev_logs`          | `qpd dev logs`          |
| Build devtools + npm-link + configure MCP | `qpd_dev_build-install` | `qpd dev build-install` |

Use `--background` with `qpd_dev_start` when running non-interactively.

### Browser Automation / UI Iteration

Use the screenshot-driven feedback loop for UI work:

1. **`qpd_dev_start`** — start Vite dev server + Chromium with CDP
2. **`qpd_browser_screenshot`** — capture current state, then read the image to see it
3. **`qpd_browser_navigate`** — go to a specific URL
4. **`qpd_browser_eval`** — run JS in the page (inspect state, trigger actions)
5. **`qpd_browser_click`** / **`qpd_browser_type`** / **`qpd_browser_wait`** — interact with UI elements
6. **`qpd_browser_set-editor`** — set Monaco editor content for DSL testing
7. **`qpd_browser_content`** — get rendered page text/HTML
8. **`qpd_browser_logs`** — check console errors

**Workflow:** make code change → build → screenshot → evaluate → iterate

### Prerequisites

You need Node/NPM installed on your machine to run the application.

### Build and Run

The bootstrap script handles everything — installs dependencies, builds all packages
(cpm, scheduler, project-flow-syntax, devtools), links the `qpd` CLI, and writes the MCP config:

```shell
node packages/devtools/bin/build-install.js
```

Then start the dev server:

```shell
qpd dev start
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
