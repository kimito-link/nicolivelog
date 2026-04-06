import { UNKNOWN_USER_KEY } from './userRooms.js';

/**
 * Paul Tol Bright に近い 8 色を OKLCH で表現（カテゴリ識別用）。
 * 出典: Paul Tol (2021) Colour schemes for data visualization 系の高コントラスト配色を参考に自前調整。
 */
export const ACCENT_OKLCH_LIGHT = Object.freeze([
  'oklch(0.52 0.13 264)',
  'oklch(0.58 0.12 230)',
  'oklch(0.52 0.12 150)',
  'oklch(0.62 0.14 85)',
  'oklch(0.54 0.16 25)',
  'oklch(0.52 0.14 310)',
  'oklch(0.62 0.14 50)',
  'oklch(0.56 0.02 264)'
]);

/** ダーク背景向け: L やや高め・C やや低め */
export const ACCENT_OKLCH_DARK = Object.freeze([
  'oklch(0.78 0.09 264)',
  'oklch(0.82 0.08 230)',
  'oklch(0.78 0.09 150)',
  'oklch(0.84 0.10 85)',
  'oklch(0.79 0.11 25)',
  'oklch(0.78 0.09 310)',
  'oklch(0.84 0.10 50)',
  'oklch(0.78 0.03 264)'
]);

/**
 * ポップアップの `--nl-user-accent` 用（Chrome 100 でも有効な sRGB）。
 * OKLCH 版と同系の 8 色。
 */
export const ACCENT_HEX_LIGHT = Object.freeze([
  '#375ca8',
  '#0f8ab8',
  '#217a4a',
  '#c9a227',
  '#c43c4f',
  '#8f3d8c',
  '#d9781a',
  '#6b6f7a'
]);

export const ACCENT_HEX_DARK = Object.freeze([
  '#8eb7ff',
  '#6fd4f5',
  '#5ecd8f',
  '#e8cf5a',
  '#ff8a9d',
  '#d896ff',
  '#ffb366',
  '#b4b8c4'
]);

/**
 * FNV-1a 32-bit（決定論的・userAccentHue と同一）
 * @param {string} s
 * @returns {number}
 */
function fnv1a32(s) {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i += 1) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}

/**
 * @param {string} userKey
 * @returns {number|null} 0–7、未識別は null
 */
export function accentSlotFromUserKey(userKey) {
  const k = String(userKey || '').trim();
  if (!k || k === UNKNOWN_USER_KEY) return null;
  return fnv1a32(k) % 8;
}

/**
 * @param {number} slot
 * @param {'light'|'dark'} colorScheme
 * @returns {string|null} CSS color
 */
export function accentOklchForSlot(slot, colorScheme) {
  if (!Number.isInteger(slot) || slot < 0 || slot > 7) return null;
  const pal = colorScheme === 'dark' ? ACCENT_OKLCH_DARK : ACCENT_OKLCH_LIGHT;
  return pal[slot] ?? null;
}

/**
 * UI 用アクセント色（拡張の box-shadow / color-mix にそのまま渡す）。
 * @param {number} slot
 * @param {'light'|'dark'} colorScheme
 * @returns {string|null} #rrggbb
 */
export function accentColorForSlot(slot, colorScheme) {
  if (!Number.isInteger(slot) || slot < 0 || slot > 7) return null;
  const pal = colorScheme === 'dark' ? ACCENT_HEX_DARK : ACCENT_HEX_LIGHT;
  return pal[slot] ?? null;
}

/**
 * userId が無いニコ生コメントでも、サムネ URL や stableId でスロットを付与する。
 * @param {unknown} entry
 * @param {{ tileSrc?: string, stableId?: string, defaultTileSrc?: string }} [opts]
 * @returns {number|null}
 */
export function accentSlotFromSupportEntry(entry, opts) {
  if (!entry || typeof entry !== 'object') return null;
  const e = /** @type {{ userId?: string, nickname?: string }} */ (entry);
  const uid = String(e.userId || '').trim();
  if (uid) return accentSlotFromUserKey(uid);

  const tile = String(opts?.tileSrc || '').trim();
  const defaultTile = String(opts?.defaultTileSrc || '').trim();
  const tileIsDistinct = Boolean(tile && (!defaultTile || tile !== defaultTile));

  if (tileIsDistinct) return accentSlotFromUserKey(`\u0001t:${tile}`);

  const sid = String(opts?.stableId || '').trim();
  if (sid) return accentSlotFromUserKey(`\u0001s:${sid}`);

  const nick = String(e.nickname || '').trim();
  if (nick) return accentSlotFromUserKey(`\u0001n:${nick}`);

  if (tile) return accentSlotFromUserKey(`\u0001t:${tile}`);
  return null;
}

/**
 * @param {unknown} entry
 * @returns {string}
 */
export function supportUserKeyFromEntry(entry) {
  if (!entry || typeof entry !== 'object') return UNKNOWN_USER_KEY;
  const uid = String(/** @type {{ userId?: string }} */ (entry).userId || '').trim();
  return uid || UNKNOWN_USER_KEY;
}

/**
 * 表示順で entries[index] が同一ユーザーキーの何回目か（1 始まり）。
 * @param {ReadonlyArray<unknown>} entries
 * @param {number} index
 * @returns {number} 範囲外は 0
 */
export function supportOrdinalForIndex(entries, index) {
  if (!Array.isArray(entries) || !Number.isFinite(index)) return 0;
  const i = Math.floor(index);
  if (i < 0 || i >= entries.length) return 0;
  const key = supportUserKeyFromEntry(entries[i]);
  let n = 0;
  for (let j = 0; j <= i; j += 1) {
    if (supportUserKeyFromEntry(entries[j]) === key) n += 1;
  }
  return n;
}

/**
 * 先頭から index までにおける同一ユーザーキーの総数（ordinal と同値）。
 * @param {ReadonlyArray<unknown>} entries
 * @param {number} index
 */
export function supportSameUserCountThroughIndex(entries, index) {
  return supportOrdinalForIndex(entries, index);
}

/**
 * entries 全体で userKey に一致する件数。
 * @param {ReadonlyArray<unknown>} entries
 * @param {string} userKey
 */
export function supportSameUserTotalInEntries(entries, userKey) {
  if (!Array.isArray(entries) || !userKey) return 0;
  let n = 0;
  for (const e of entries) {
    if (supportUserKeyFromEntry(e) === userKey) n += 1;
  }
  return n;
}
