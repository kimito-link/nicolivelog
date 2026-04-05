/**
 * ユーザー由来文字列を HTML 断片に埋め込む前にエスケープする（XSS 対策の共通実装）
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
