#!/usr/bin/env node

// Self-bootstrap: compile all packages, npm-link qpd, write MCP config.
// Uses process.execPath to find npm/npx — no PATH dependency.

import { execFileSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const packageDir = path.resolve(__dirname, '..');
const monorepoRoot = path.resolve(packageDir, '../..');
const binDir = path.dirname(process.execPath);
const npmPath = path.join(binDir, 'npm');

const env = { ...process.env, PATH: `${binDir}:${process.env.PATH}` };

function run(label, cmd, args, cwd) {
  console.log(`» ${label}`);
  execFileSync(cmd, args, { cwd, stdio: 'inherit', env });
}

console.log(`Node:    ${process.execPath}`);
console.log(`Package: ${packageDir}`);
console.log();

// Step 1: Install dependencies
run('Installing dependencies…', npmPath, ['install'], monorepoRoot);

// Step 2: Build @quickplan/cpm
run('Building @quickplan/cpm…', npmPath, ['run', 'build'], path.join(monorepoRoot, 'packages/cpm'));

// Step 3: Build @quickplan/scheduler
run('Building @quickplan/scheduler…', npmPath, ['run', 'build'], path.join(monorepoRoot, 'packages/scheduler'));

// Step 4: Build @quickplan/project-flow-syntax
const pfsDir = path.join(monorepoRoot, 'packages/project-flow-syntax');
run('Generating Langium grammar…', npmPath, ['run', 'langium:generate'], pfsDir);
run('Building @quickplan/project-flow-syntax…', npmPath, ['run', 'build'], pfsDir);

// Step 5: Build @quickplan/devtools
run('Building @quickplan/devtools…', npmPath, ['run', 'build'], packageDir);

// Step 6: Link
run('Linking qpd…', npmPath, ['link'], packageDir);

// Step 7: Configure MCP
const mcpConfig = {
  mcpServers: {
    qpd: {
      command: "node",
      args: ['packages/devtools/bin/qpd-mcp.js'],
    },
  },
};
writeFileSync(
  path.join(monorepoRoot, '.mcp.json'),
  JSON.stringify(mcpConfig, null, 2) + '\n',
);
console.log('MCP config written.');
console.log('Done.');
