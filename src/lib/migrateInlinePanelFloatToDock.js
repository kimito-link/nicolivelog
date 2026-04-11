/**
 * 旧「ポップアップ風（floating）」利用者を画面下ドックへ一度だけ移す（公式右パネルとの衝突緩和）。
 * Service Worker では ESM インポートできないため、extension/background.js に同等ロジックを二重記載している。
 */

import {
  KEY_INLINE_PANEL_FLOAT_TO_DOCK_MIGRATED,
  KEY_INLINE_PANEL_PLACEMENT,
  INLINE_PANEL_PLACEMENT_DOCK_BOTTOM,
  INLINE_PANEL_PLACEMENT_FLOATING
} from './storageKeys.js';

/**
 * @param {{
 *   get: (keys: string|string[]) => Promise<Record<string, unknown>>;
 *   set: (o: Record<string, unknown>) => Promise<unknown>;
 * }} storage chrome.storage.local 互換
 * @returns {Promise<{ changed: boolean }>}
 */
export async function migrateFloatingInlinePanelToDockOnce(storage) {
  const bag = await storage.get([
    KEY_INLINE_PANEL_PLACEMENT,
    KEY_INLINE_PANEL_FLOAT_TO_DOCK_MIGRATED
  ]);
  if (bag[KEY_INLINE_PANEL_FLOAT_TO_DOCK_MIGRATED] === true) {
    return { changed: false };
  }
  const p = String(bag[KEY_INLINE_PANEL_PLACEMENT] ?? '')
    .trim()
    .toLowerCase();
  if (p !== INLINE_PANEL_PLACEMENT_FLOATING) {
    return { changed: false };
  }
  await storage.set({
    [KEY_INLINE_PANEL_PLACEMENT]: INLINE_PANEL_PLACEMENT_DOCK_BOTTOM,
    [KEY_INLINE_PANEL_FLOAT_TO_DOCK_MIGRATED]: true
  });
  return { changed: true };
}
