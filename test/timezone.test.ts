import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';

test('topology output is timezone-independent', () => {
  const node = process.execPath; const cli = resolve('src/cli.ts');
  const output = ['UTC', 'Europe/Istanbul', 'America/New_York', 'Asia/Tokyo'].map(TZ => {
    const result = spawnSync(node, ['--experimental-strip-types', cli, 'inspect', 'topology', '--year', '2027', '--month', '2', '--week-start', 'monday'], { encoding: 'utf8', env: { ...process.env, TZ } });
    assert.equal(result.status, 0, result.stderr); return result.stdout;
  });
  assert.ok(output.every(value => value === output[0]));
});
