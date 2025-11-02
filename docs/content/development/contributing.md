# Contributing

Thank you for your interest in contributing to QuickPlan! This guide will help you get started.

## Getting Started

### Prerequisites

- Node.js 16.x or higher
- npm 8.x or higher
- Git
- A code editor (VS Code recommended)

### Setting Up Your Development Environment

1. Fork the repository on GitHub
2. Clone your fork locally:

```bash
git clone https://github.com/YOUR_USERNAME/quickplan.git
cd quickplan
```

3. Add the upstream repository:

```bash
git remote add upstream https://github.com/ORIGINAL_OWNER/quickplan.git
```

4. Install dependencies:

```bash
npm install
```

5. Generate language files:

```bash
cd packages/project-flow-syntax
npm run langium:generate
npm run build
npm run build:web
cd ../..
```

6. Start the development server:

```bash
npm run dev
```

## Development Workflow

### Creating a Branch

Create a new branch for your work:

```bash
git checkout -b feature/your-feature-name
```

Use descriptive branch names:
- `feature/` for new features
- `fix/` for bug fixes
- `docs/` for documentation changes
- `refactor/` for code refactoring

### Making Changes

1. Make your changes in your branch
2. Test your changes locally
3. Follow the existing code style
4. Write clear commit messages

### Commit Messages

Use clear, descriptive commit messages:

```
Add user authentication feature

- Implement login form
- Add JWT token handling
- Create authentication context
```

### Code Style

QuickPlan uses:
- **ESLint** for linting
- **Prettier** for code formatting

Run the linter:

```bash
npm run lint
```

Fix linting issues automatically:

```bash
npm run lint:fix
```

### Testing

Before submitting your changes:

1. Test the application manually
2. Verify the build works: `npm run build:all`
3. Check for console errors
4. Test in different browsers if possible

## Submitting Changes

### Pull Requests

1. Push your branch to your fork:

```bash
git push origin feature/your-feature-name
```

2. Open a Pull Request on GitHub
3. Fill out the PR template with:
   - Description of changes
   - Motivation and context
   - Testing performed
   - Screenshots (if UI changes)

### PR Guidelines

- Keep PRs focused on a single feature or fix
- Update documentation if needed
- Respond to review feedback
- Be patient and respectful

## Areas for Contribution

QuickPlan needs help in many areas:

### High Priority

- **Persistent Storage**: Add local storage or file save/load
- **Export Features**: PDF, PNG, or SVG export
- **Testing**: Unit tests and integration tests
- **Documentation**: Improve and expand docs

### Features

- Undo/redo functionality
- Task templates
- Project templates
- Advanced task properties (resources, costs)
- Gantt chart view
- Critical path highlighting

### Bug Fixes

Check the GitHub issues for bugs that need fixing.

### Documentation

- Improve existing documentation
- Add tutorials and examples
- Create video guides
- Translate documentation

## Code Review Process

1. Maintainers will review your PR
2. Address any requested changes
3. Once approved, your PR will be merged
4. Your contribution will be credited

## Getting Help

If you need help:

- Open an issue with your question
- Check existing issues and documentation
- Be specific about what you're trying to do

## Code of Conduct

Be respectful, constructive, and professional in all interactions.

## License

By contributing to QuickPlan, you agree that your contributions will be licensed under the project's license (see [License](../about/license.md)).

## Recognition

Contributors will be recognized in:
- The project README
- Release notes
- The contributors page (when created)

Thank you for contributing to QuickPlan! 🎉
