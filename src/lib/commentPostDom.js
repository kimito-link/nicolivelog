/**
 * コメント送信ボタン探索を、同一フォーム/近傍スコープを優先して行う。
 * watch 側の DOM が軽く変わっても「送信」「投稿」などの文言で拾えるようにする。
 */

const COMMENT_SEND_LABEL_RE = /(コメント.{0,8}(送信|投稿)|送信|投稿|書き込|書込|submit|send|post)/i;
const COMMENT_SEND_ATTR_RE = /(send|submit|post|comment|コメント|投稿|書込)/i;
const COMMENT_NON_SUBMIT_RE =
  /(reload|再読み込み|html|export|save|保存|capture|screen|screenshot|voice|mic|settings?|detail|閉じ|close|cancel|音声|スクショ)/i;
const COMMENT_BUTTON_CANDIDATE_SELECTOR =
  'button, input[type="submit"], input[type="button"], [role="button"]';

/**
 * @param {Element|null|undefined} el
 * @returns {el is HTMLElement}
 */
function isHtmlElement(el) {
  return el instanceof HTMLElement;
}

/**
 * @param {HTMLElement} el
 * @returns {boolean}
 */
export function isVisibleCommentActionElement(el) {
  if (!isHtmlElement(el) || !el.isConnected || el.hidden) return false;
  const style = window.getComputedStyle(el);
  if (style.display === 'none' || style.visibility === 'hidden') return false;
  try {
    if (typeof el.getClientRects === 'function' && el.getClientRects().length > 0) {
      return true;
    }
  } catch {
    // no-op
  }
  return true;
}

/**
 * @param {HTMLElement} el
 * @returns {boolean}
 */
function isDisabledCommentActionElement(el) {
  if (el.matches('[disabled],[aria-disabled="true"]')) return true;
  if (el instanceof HTMLButtonElement || el instanceof HTMLInputElement) {
    return el.disabled;
  }
  return false;
}

/**
 * @param {HTMLElement} el
 * @returns {string}
 */
function readCommentActionPrimaryLabel(el) {
  const parts = [];
  for (const key of ['aria-label', 'title']) {
    const v = String(el.getAttribute(key) || '').trim();
    if (v) parts.push(v);
  }
  if (el instanceof HTMLInputElement) {
    const v = String(el.value || '').trim();
    if (v) parts.push(v);
  }
  const text = String(el.textContent || '').trim();
  if (text) parts.push(text);
  return parts.join(' ').trim();
}

/**
 * @param {HTMLElement} el
 * @returns {string}
 */
function readCommentActionTokenText(el) {
  const parts = [];
  for (const key of ['id', 'name', 'class', 'data-testid', 'data-test-id']) {
    const v = String(el.getAttribute(key) || '').trim();
    if (v) parts.push(v);
  }
  return parts.join(' ').trim();
}

/**
 * @param {HTMLElement} el
 * @param {HTMLElement|null} editor
 * @returns {number}
 */
function scoreCommentSubmitButton(el, editor) {
  let score = 0;
  const label = readCommentActionPrimaryLabel(el);
  const tokens = readCommentActionTokenText(el);
  const type =
    el instanceof HTMLButtonElement || el instanceof HTMLInputElement
      ? String(el.type || '').trim().toLowerCase()
      : '';
  const editorForm = editor?.closest('form') || null;
  const buttonForm = el.closest('form');

  if (editorForm && buttonForm === editorForm) score += 140;
  else if (editorForm && buttonForm && buttonForm !== editorForm) score -= 40;

  if (type === 'submit') score += 90;
  if (type === 'button') score += 12;
  if (el.getAttribute('role') === 'button') score += 8;

  if (COMMENT_SEND_LABEL_RE.test(label)) score += 110;
  if (COMMENT_SEND_ATTR_RE.test(tokens)) score += 45;
  if (/comment|コメント/i.test(label)) score += 18;

  if (COMMENT_NON_SUBMIT_RE.test(label) || COMMENT_NON_SUBMIT_RE.test(tokens)) {
    score -= 220;
  }

  if (editor && editor.parentElement && el.parentElement === editor.parentElement) {
    score += 20;
  }

  return score;
}

/**
 * @param {ParentNode} root
 * @param {HTMLElement|null} [editor]
 * @returns {HTMLElement|null}
 */
export function findCommentSubmitButton(root, editor = null) {
  if (!root || typeof root.querySelectorAll !== 'function') return null;

  /** @type {HTMLElement|null} */
  let best = null;
  let bestScore = -Infinity;

  const list = root.querySelectorAll(COMMENT_BUTTON_CANDIDATE_SELECTOR);
  for (const node of list) {
    if (!(node instanceof HTMLElement)) continue;
    if (!isVisibleCommentActionElement(node)) continue;
    if (isDisabledCommentActionElement(node)) continue;
    const score = scoreCommentSubmitButton(node, editor);
    if (score > bestScore) {
      bestScore = score;
      best = node;
    }
  }

  const minimumScore =
    editor != null ? 80 : root instanceof HTMLFormElement ? 60 : 120;
  return bestScore >= minimumScore ? best : null;
}
