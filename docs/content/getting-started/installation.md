# Installation

This guide will help you install and set up QuickPlan on your local machine.

## Prerequisites

You need Node.js and npm installed on your machine to run QuickPlan.

- **Node.js** version 16.x or higher
- **npm** version 8.x or higher

To check if you have Node.js and npm installed:

```bash
node --version
npm --version
```

If you don't have Node.js installed, download it from [nodejs.org](https://nodejs.org/).

## Installation Steps

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/quickplan.git
cd quickplan
```

### 2. Install Dependencies

```bash
npm install
```

This will install all the required dependencies for the entire monorepo.

### 3. Generate Language Files

QuickPlan uses a custom language syntax. You need to generate the language parser:

```bash
cd packages/project-flow-syntax
npm run langium:generate
npm run build
npm run build:web
cd ../..
```

### 4. Verify Installation

After installation, you can verify everything is set up correctly by running the development server (see [Quick Start](quickstart.md)).

## Troubleshooting

### Node Version Issues

If you encounter issues with Node.js versions, consider using [nvm](https://github.com/nvm-sh/nvm) (Node Version Manager) to manage multiple Node.js versions on your machine.

### Build Errors

If you encounter build errors during the language generation step, make sure you're in the correct directory and all dependencies are installed:

```bash
cd packages/project-flow-syntax
npm install
npm run langium:generate
```

## Next Steps

Now that you have QuickPlan installed, proceed to the [Quick Start](quickstart.md) guide to create your first project.
