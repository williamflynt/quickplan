# Claude Code Instructions

## Dev Tooling — use `qpd`

This project has a custom CLI tool **`qpd`** exposed as both MCP tools and a Bash command.
Always prefer MCP tools (`mcp__qpd__*`) first, `qpd` via Bash second.

**Never use these raw commands directly:**
`npm run build`, `npx tsc`, `npx vitest`, `npx eslint`, `npx prettier`

| Task                        | MCP tool                | Bash fallback            |
|-----------------------------|-------------------------|--------------------------|
| Build a package             | `qpd_dev_build`         | `qpd dev build <pkg>`   |
| Run tests                   | `qpd_dev_test`          | `qpd dev test <pkg>`    |
| Lint (+ auto-fix)           | `qpd_dev_lint`          | `qpd dev lint <pkg>`    |
| Format                      | `qpd_dev_format`        | `qpd dev format <pkg>`  |
| Start dev server + Chromium | `qpd_dev_start`         | `qpd dev start`         |
| Stop dev server             | `qpd_dev_stop`          | `qpd dev stop`          |
| Search files                | `qpd_search`            | `qpd search <pattern>`  |
| Find files                  | `qpd_find`              | `qpd find <glob>`       |
| Build + link devtools       | `qpd_dev_build-install` | `qpd dev build-install`  |

Use `--background` with `qpd_dev_start` when running non-interactively.

## UI Iteration

Use the screenshot-driven feedback loop: make change → build → screenshot → evaluate → iterate.

Browser tools: `qpd_browser_screenshot`, `qpd_browser_navigate`, `qpd_browser_eval`,
`qpd_browser_click`, `qpd_browser_type`, `qpd_browser_set-editor`, `qpd_browser_content`, `qpd_browser_logs`.
