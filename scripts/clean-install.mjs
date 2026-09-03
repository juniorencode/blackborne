/*
 * A from-scratch install, which is what CI does and what a local `pnpm install`
 * never is.
 *
 * This exists because of a real escape. A pnpm setting was left in a pending
 * state — pnpm had written a placeholder into pnpm-workspace.yaml asking to be
 * filled in — and locally it only warned, because node_modules already existed.
 * On a clean install a pending decision about install scripts is an error, so
 * CI failed on a branch that was green on every machine that had built it.
 *
 * Run it after touching pnpm-workspace.yaml, .npmrc, or anything about
 * dependencies. It is slow on purpose; it is not part of `pnpm verify`.
 *
 *   pnpm verify:clean
 */
import { execSync } from 'node:child_process';
import { readdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';

const SKIP = new Set(['.git', 'node_modules', 'dist', 'storybook-static']);

/** Every node_modules in the workspace, without descending into them. */
function findNodeModules(dir, depth = 0, found = []) {
  if (depth > 3) return found;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const full = join(dir, entry.name);
    if (entry.name === 'node_modules') {
      found.push(full);
      continue;
    }
    if (SKIP.has(entry.name)) continue;
    findNodeModules(full, depth + 1, found);
  }
  return found;
}

const targets = findNodeModules(process.cwd());

if (targets.length === 0) {
  console.log('nothing to remove; already clean');
} else {
  for (const target of targets) {
    console.log(`removing ${target}`);
    rmSync(target, { recursive: true, force: true });
  }
}

console.log(
  '\ninstalling exactly as CI does: pnpm install --frozen-lockfile\n'
);
execSync('pnpm install --frozen-lockfile', { stdio: 'inherit' });
