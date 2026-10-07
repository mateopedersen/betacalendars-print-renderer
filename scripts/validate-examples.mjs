import { mkdtemp, rm, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

const temp = await mkdtemp(join(tmpdir(), 'betacal-'));
try {
  const cli = new URL('../src/cli.ts', import.meta.url).pathname;
  const run = (args) => { const result = spawnSync(process.execPath, ['--experimental-strip-types', cli, ...args], { encoding: 'utf8' }); if (result.status !== 0) throw new Error(result.stderr); return result.stdout.trim().split('\n'); };
  run(['render', 'month', '--year', '2027', '--month', '1', '--format', 'svg,pdf,json', '--output', temp]);
  for (const file of ['january-2027.svg', 'january-2027.pdf', 'january-2027.json']) if ((await stat(join(temp, file))).size === 0) throw new Error(`${file} is empty`);
  run(['render', 'year', '--year', '2027', '--format', 'pdf', '--output', temp]);
  run(['render', 'range', '--from', '2026-11', '--to', '2027-02', '--format', 'json', '--output', temp]);
  run(['render', 'blank', '--rows', '5', '--columns', '7', '--format', 'svg,pdf,json', '--output', temp]);
  console.log('January SVG/PDF/JSON, 12-page year PDF, year-boundary range JSON, and blank grid artifacts validated.');
} finally { await rm(temp, { recursive: true, force: true }); }
