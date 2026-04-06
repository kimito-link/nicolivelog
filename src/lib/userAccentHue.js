import { UNKNOWN_USER_KEY } from './userRooms.js';

/**
 * FNV-1a 32-bit（決定論的・同一 userKey は常に同じ hue）
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
 * 応援グリッドのユーザー別リング色用に、userKey から色相を返す。
 * ID 未取得はノイズ低減のため null（リングなし）。
 *
 * @param {string} userKey
 * @returns {number|null} 0–359 の整数、または null
 */
export function hueFromUserKey(userKey) {
  const k = String(userKey || '').trim();
  if (!k || k === UNKNOWN_USER_KEY) return null;
  return fnv1a32(k) % 360;
}
