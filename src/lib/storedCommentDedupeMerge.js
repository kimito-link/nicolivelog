/**
 * popup normalizeStoredCommentEntries 用: 同一キー重複行のマージ（PII を増やさずフラグのみ統合）
 */

import { normalizeCommentText } from './commentRecord.js';

/** @param {string} text */
function storyCommentTextPenalty(text) {
  const s = normalizeCommentText(text).replace(/\n+/g, ' ').trim();
  if (!s) return Number.POSITIVE_INFINITY;
  const numberedTokens =
    s.match(/(?:^|[\s\u3000])\d{3,9}(?=\s+\S)/g)?.length || 0;
  return s.length + Math.max(0, numberedTokens - 1) * 240;
}

/**
 * 同一 commentNo 等の重複バリアントを 1 行にまとめる。
 * avatarObserved はどちらかが true なら true を保持（後から観測フラグが付いた行を落とさない）。
 *
 * @param {Record<string, unknown>} prev
 * @param {Record<string, unknown>} next
 * @returns {Record<string, unknown>}
 */
export function mergeStoredCommentDedupeVariants(prev, next) {
  const prevText = normalizeCommentText(prev.text);
  const nextText = normalizeCommentText(next.text);
  const preferNextText =
    Boolean(nextText) &&
    storyCommentTextPenalty(nextText) < storyCommentTextPenalty(prevText);
  const userId =
    String(next.userId || '').trim() || String(prev.userId || '').trim() || null;
  const nickname =
    String(next.nickname || '').trim() || String(prev.nickname || '').trim() || '';
  const avatarUrl =
    String(next.avatarUrl || '').trim() || String(prev.avatarUrl || '').trim() || '';
  const selfPosted = Boolean(prev.selfPosted) || Boolean(next.selfPosted);
  const avatarObserved =
    Boolean(prev.avatarObserved) || Boolean(next.avatarObserved);
  return {
    ...prev,
    ...(preferNextText ? { text: nextText || prevText } : {}),
    ...(userId ? { userId } : { userId: null }),
    ...(nickname ? { nickname } : {}),
    ...(avatarUrl ? { avatarUrl } : {}),
    ...(selfPosted ? { selfPosted: true } : {}),
    ...(avatarObserved ? { avatarObserved: true } : {})
  };
}
