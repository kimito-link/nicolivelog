import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const popupBundlePath = path.join(repoRoot, 'extension', 'dist', 'popup.js');
const contentBundlePath = path.join(repoRoot, 'extension', 'dist', 'content.js');
const popupBundle = readFileSync(popupBundlePath, 'utf8');
const contentBundle = readFileSync(contentBundlePath, 'utf8');
const buildReminder = '該当 fix を src に入れたら npm run build を忘れるな';

describe('dist bundle fix ガード', () => {
  it.each([
    {
      symbol: 'userLaneCandidatesFromStorage',
      targetName: 'extension/dist/popup.js',
      bundle: popupBundle
    },
    {
      symbol: 'mergeStoredCommentDedupeVariants',
      targetName: 'extension/dist/popup.js',
      bundle: popupBundle
    },
    {
      symbol: 'resolveUserEntryAvatarSignals',
      targetName: 'extension/dist/content.js',
      bundle: contentBundle
    }
  ])('$targetName に $symbol を含む', ({ symbol, targetName, bundle }) => {
    expect(
      bundle.includes(symbol),
      `${targetName} に ${symbol} が見つからない。${buildReminder}`
    ).toBe(true);
  });
});
