#!/usr/bin/env node

// Self-bootstrap: compile TypeScript and npm-link qpd.
// Uses process.execPath to find npm/npx — no PATH dependency.

import { execFileSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const packageDir = path.resolve(__dirname, '..');
const binDir = path.dirname(process.execPath);
const npxPath = path.join(binDir, 'npx');
const npmPath = path.join(binDir, 'npm');

const env = { ...process.env, PATH: `${binDir}:${process.env.PATH}` };
const opts = { cwd: packageDir, stdio: 'inherit', env };

console.log(`Node:    ${process.execPath}`);
console.log(`Package: ${packageDir}`);
console.log();

// Step 1: Compile
console.log('Building...');
execFileSync(npxPath, ['tsc', '-b', 'tsconfig.json'], opts);
console.log('Build complete.');

// Step 2: Link
console.log('Linking...');
execFileSync(npmPath, ['link'], opts);
console.log('`qpd` is now available.');

// Step 3: Configure MCP
const monorepoRoot = path.resolve(packageDir, '../..');
const mcpConfig = {
  mcpServers: {
    qpd: {
      command: process.execPath,
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
