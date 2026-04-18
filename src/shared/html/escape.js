/**
 * ユーザー由来文字列を HTML 断片に埋め込む前にエスケープする（XSS 対策の共通実装）。
 *
 * レイヤ: shared/ (どこからでも import 可)
 * pure: yes
 *
 * NOTE: これが正本。`src/lib/htmlEscape.js` は Phase 1 の transitional re-export
 * として残してあり、Phase 5 で削除する予定。新規 import は必ずこちらから行うこと。
 */

/** @param {unknown} s */
export function escapeHtml(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** @param {unknown} s */
export function escapeAttr(s) {
  return escapeHtml(s);
}
