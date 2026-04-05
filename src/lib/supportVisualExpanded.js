/**
 * 応援ビジュアル（アイコン列・グリッド・診断）の開閉を storage に保存するときの正規化。
 * 明示的な true/false のみをユーザー設定として扱い、それ以外は inline か否かで既定を返す。
 */

/** @param {unknown} raw @param {{ inlineMode?: boolean }} [opts] */
export function normalizeSupportVisualExpanded(raw, opts = {}) {
  const inlineMode = opts.inlineMode === true;
  if (raw === true) return true;
  if (raw === false) return false;
  return inlineMode;
}
