/**
 * LP 右端コラボ用: src/images/icon/twitter-icon.png → extension/images/lp/twitter-icon.png
 * 使い方: npm run sync:lp-twitter-icon
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const src = path.join(root, 'src', 'images', 'icon', 'twitter-icon.png');
const dest = path.join(root, 'extension', 'images', 'lp', 'twitter-icon.png');

if (!fs.existsSync(src)) {
  console.error(`sync-lp-twitter-icon: 見つかりません: ${src}`);
  process.exit(1);
}

fs.mkdirSync(path.dirname(dest), { recursive: true });
fs.copyFileSync(src, dest);
console.log(`sync-lp-twitter-icon: ${path.relative(root, src)} → ${path.relative(root, dest)}`);
