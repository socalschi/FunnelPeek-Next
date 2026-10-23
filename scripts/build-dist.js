import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Ensure Windows System32 and WindowsPowerShell are present in PATH
if (process.platform === 'win32') {
  const sysRoot = process.env.SystemRoot || 'C:\\Windows';
  const essentialPaths = [
    path.join(sysRoot, 'System32'),
    path.join(sysRoot, 'System32', 'WindowsPowerShell', 'v1.0'),
    sysRoot
  ];

  const currentPaths = (process.env.PATH || '').split(path.delimiter);
  const toAdd = essentialPaths.filter(p => !currentPaths.some(cp => cp.toLowerCase() === p.toLowerCase()));
  if (toAdd.length > 0) {
    process.env.PATH = `${toAdd.join(path.delimiter)}${path.delimiter}${process.env.PATH}`;
  }
}

const args = process.argv.slice(2);
const builderBin = path.join(
  rootDir,
  'node_modules',
  '.bin',
  process.platform === 'win32' ? 'electron-builder.cmd' : 'electron-builder'
);

const child = spawn(`"${builderBin}"`, args, {
  cwd: rootDir,
  env: process.env,
  stdio: 'inherit',
  shell: true
});

child.on('close', (code) => {
  process.exit(code || 0);
});
