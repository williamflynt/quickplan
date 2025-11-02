# Architecture

This document describes the technical architecture of QuickPlan.

## Overview

QuickPlan is a web-based application built with modern JavaScript/TypeScript technologies. It's organized as a monorepo with multiple packages.

## Project Structure

```
quickplan/
├── packages/
│   ├── project-flow-syntax/    # Domain-specific language for project definitions
│   └── web/                     # Web application (React + Vite)
├── docs/                        # Documentation (MkDocs)
└── package.json                 # Root package configuration
```

## Technology Stack

### Frontend (Web Package)

- **React 19** - UI framework
- **TypeScript** - Type-safe JavaScript
- **Vite** - Build tool and development server
- **Ant Design** - UI component library
- **XYFlow (React Flow)** - Graph visualization library
- **Zustand** - State management
- **ELK.js** - Automatic graph layout

### Language Package

- **Langium** - DSL (Domain Specific Language) framework
- **TypeScript** - Implementation language

The project-flow-syntax package defines a custom language for describing project structures, which is parsed and used to generate the PERT charts.

## Architecture Patterns

### Component Structure

The web application follows a component-based architecture:

- **UI Components** - Reusable React components
- **State Management** - Centralized state with Zustand
- **Graph Rendering** - XYFlow for interactive charts
- **Layout Engine** - ELK.js for automatic node positioning

### Data Flow

1. User inputs project information
2. Data is stored in Zustand state
3. State changes trigger re-renders
4. ELK.js calculates optimal layout
5. XYFlow renders the visual graph

### In-Memory Storage

Currently, all project data is stored in browser memory:

- **Benefits**: Simple, fast, no backend required
- **Limitations**: Data is lost on page refresh, no collaboration features

Future versions may add:
- Local storage persistence
- File import/export
- Cloud storage integration

## Build System

QuickPlan uses npm workspaces for monorepo management:

```bash
# Install all dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build:all
```

### Language Generation

The project-flow-syntax package requires a generation step:

```bash
cd packages/project-flow-syntax
npm run langium:generate
npm run build
npm run build:web
```

This generates the parser from the Langium grammar definition.

## Graph Visualization

### ELK.js Layout

ELK (Eclipse Layout Kernel) is used for automatic graph layout:

- **Algorithm**: Layered layout (suitable for PERT charts)
- **Direction**: Left-to-right flow
- **Features**: Automatic edge routing, minimal crossings

### XYFlow Rendering

XYFlow (formerly React Flow) provides:

- **Interactive canvas**: Pan, zoom, selection
- **Custom nodes**: Styled task nodes
- **Edges**: Dependency arrows
- **Events**: Click, drag, hover interactions

## Development Workflow

### Local Development

1. Start the development server with `npm run dev`
2. Make changes to source files
3. Vite automatically reloads the browser
4. Changes appear immediately

### Code Style

- **ESLint** for linting
- **Prettier** for formatting
- **TypeScript** for type checking

### Testing

(Testing infrastructure to be added)

## Future Architecture Considerations

Potential improvements:

- **Persistence Layer**: Add backend for data storage
- **Real-time Collaboration**: WebSocket support for multi-user editing
- **Export Capabilities**: PDF, PNG, SVG export
- **Import Formats**: Project file formats (MS Project, JIRA, etc.)
- **Undo/Redo**: Command pattern for action history

## Contributing

See the [Contributing Guide](contributing.md) for information on how to contribute to QuickPlan's development.
