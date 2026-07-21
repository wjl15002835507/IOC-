import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  scanProjectEntries,
  writeEntriesManifestAtomic,
} from '../vite-plugins/utils/entriesManifestCore.js';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(scriptDir, '..');
const entries = writeEntriesManifestAtomic(
  projectRoot,
  scanProjectEntries(projectRoot, ['prototypes', 'themes']),
);
const prototypeKeys = Object.keys(entries.js || {})
  .filter((key) => key.startsWith('prototypes/'))
  .sort((a, b) => a.localeCompare(b));
const distDir = path.join(projectRoot, 'dist');

fs.rmSync(distDir, { recursive: true, force: true });
fs.mkdirSync(distDir, { recursive: true });

if (prototypeKeys.length === 0) {
  console.log('No prototypes found; publishing the project landing page only.');
  process.exit(0);
}

const npxCommand = process.platform === 'win32' ? 'npx.cmd' : 'npx';
for (const key of prototypeKeys) {
  console.log(`Building online prototype: ${key}`);
  const result = spawnSync(npxCommand, ['vite', 'build'], {
    cwd: projectRoot,
    env: { ...process.env, ENTRY_KEY: key },
    stdio: 'inherit',
  });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

console.log(`Built ${prototypeKeys.length} online prototype(s).`);
