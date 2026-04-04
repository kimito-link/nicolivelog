/**
 * コメント欄の Enter 系キーで送信するか／既定動作に任せるか。
 * IME 変換中は常に default（確定・改行に任せる）。
 */

/** @typedef {'submit'|'default'} CommentComposeKeyResult */

/**
 * @param {{
 *   key: string,
 *   ctrlKey: boolean,
 *   metaKey: boolean,
 *   shiftKey: boolean,
 *   isComposing: boolean,
 *   enterSendsComment: boolean
 * }} p
 * @returns {CommentComposeKeyResult}
 */
export function commentComposeKeyAction(p) {
  if (p.key !== 'Enter') return 'default';
  if (p.isComposing) return 'default';

  const mod = Boolean(p.ctrlKey || p.metaKey);
  if (mod) return 'submit';

  if (p.enterSendsComment) {
    if (p.shiftKey) return 'default';
    return 'submit';
  }

  return 'default';
}
