import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const popupBundlePath = path.join(repoRoot, 'extension', 'dist', 'popup.js');
const popupBundle = readFileSync(popupBundlePath, 'utf8');
const buildReminder =
  '該当 fix を master に merge したなら npm run build を忘れずに';

describe('extension/dist/popup.js — fix 反映ガード', () => {
  it.each([
    ['userLaneCandidatesFromStorage', 'storage 集約'],
    ['mergeStoredCommentDedupeVariants', 'dedupe fix'],
    ['resolveUserEntryAvatarSignals', '観測信号分離']
  ])('%s を含む', (symbol, fixName) => {
    expect(
      popupBundle.includes(symbol),
      `${fixName}: ${symbol} が extension/dist/popup.js に見つかりません。${buildReminder}`
    ).toBe(true);
  });
});
