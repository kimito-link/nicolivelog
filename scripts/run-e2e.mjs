/**
 * SKIP_E2E=1 のときは成功終了（CI などディスプレイなし環境用）。
 * それ以外は playwright test を起動する。
 */
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

if (process.env.SKIP_E2E === '1') {
  console.log('SKIP_E2E=1: Playwright E2E をスキップしました。');
  process.exit(0);
}

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const extra = process.argv.slice(2);
const r = spawnSync('npx', ['playwright', 'test', ...extra], {
  cwd: root,
  stdio: 'inherit',
  shell: true
});
process.exit(r.status === null ? 1 : r.status);
