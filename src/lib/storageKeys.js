/**
 * chrome.storage.local キー（プレフィックスで衝突回避）
 */

export const KEY_RECORDING = 'nls_recording_enabled';

/** ポップアップが「アクティブタブが watch 以外」のとき表示用（コンテンツスクリプトが更新） */
export const KEY_LAST_WATCH_URL = 'nls_last_watch_url';

/** @param {string} liveId lv123 */
export function commentsStorageKey(liveId) {
  const id = String(liveId || '').trim().toLowerCase();
  return `nls_comments_${id}`;
}
