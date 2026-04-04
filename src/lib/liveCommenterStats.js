/**
 * 記録済みコメントから「ユニーク投稿者（推定）」用の集計（純関数）
 */

import { isHttpOrHttpsUrl } from './supportGrowthTileSrc.js';

/**
 * @param {{ userId?: string|null|number, text?: string }|null|undefined} row
 * @returns {string} 正規化済み userId。未取得は空文字
 */
export function normalizedUserIdFromRow(row) {
  if (row == null || typeof row !== 'object') return '';
  const raw = row.userId;
  if (raw == null) return '';
  const s = String(raw).trim();
  return s;
}

/**
 * @param {readonly { userId?: string|null|number, avatarUrl?: string|null }[]} rows
 * @returns {{
 *   totalComments: number,
 *   uniqueKnownUserIds: number,
 *   commentsWithoutUserId: number,
 *   distinctAvatarUrls: number
 * }}
 */
export function summarizeRecordedCommenters(rows) {
  const list = Array.isArray(rows) ? rows : [];
  let commentsWithoutUserId = 0;
  const set = new Set();
  const avatars = new Set();
  for (const row of list) {
    const uid = normalizedUserIdFromRow(row);
    if (!uid) commentsWithoutUserId += 1;
    else set.add(uid);
    const av =
      row && typeof row === 'object'
        ? String(row.avatarUrl || '').trim()
        : '';
    if (isHttpOrHttpsUrl(av)) avatars.add(av);
  }
  return {
    totalComments: list.length,
    uniqueKnownUserIds: set.size,
    commentsWithoutUserId,
    distinctAvatarUrls: avatars.size
  };
}
