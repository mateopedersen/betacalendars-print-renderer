import { readdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

async function collect(path) {
  const result = [];
  for (const entry of await readdir(path, { withFileTypes: true })) {
    const full = resolve(path, entry.name);
    if (entry.isDirectory()) result.push(...await collect(full));
    else if (entry.name.endsWith('.ts')) result.push(full);
  }
  return result;
}
const files = await collect('src');
for (const file of files) {
  const result = spawnSync(process.execPath, ['--experimental-strip-types', '--check', file], { stdio: 'inherit' });
  if (result.status !== 0) process.exit(result.status ?? 1);
}
console.log(`Checked ${files.length} TypeScript source files with Node's built-in TypeScript syntax parser.`);
