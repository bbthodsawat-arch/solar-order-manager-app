import { spawnSync } from 'node:child_process';

const result = spawnSync('npx', ['tsc', '--noEmit', '--project', 'tsconfig.release.json'], {
  stdio: 'inherit',
  shell: process.platform === 'win32',
});

if (result.error) throw result.error;
if (result.status !== 0) process.exit(result.status ?? 1);
