/**
 * NDGR decodeChat の結果を mergeNewComments 向け行に変換する。
 */

import { normalizeCommentText } from './commentRecord.js';

/**
 * @param {import('./ndgrDecode.js').NdgrChat} chat
 * @returns {string|null}
 */
function ndgrChatUserId(chat) {
  /** page-intercept の handleNdgrResult と同じく rawUserId が falsy（0 含む）ならハッシュへ */
  if (chat.rawUserId) {
    const s = String(chat.rawUserId).trim();
    if (s) return s;
  }
  const h = String(chat.hashedUserId || '').trim();
  return h || null;
}

/**
 * @param {import('./ndgrDecode.js').NdgrChat[]} chats
 * @returns {{ commentNo: string, text: string, userId: string, nickname?: string }[]}
 */
export function ndgrChatsToMergeRows(chats) {
  if (!Array.isArray(chats) || !chats.length) return [];
  /** @type {{ commentNo: string, text: string, userId: string, nickname?: string }[]} */
  const out = [];
  for (const chat of chats) {
    if (!chat || chat.no == null) continue;
    const uid = ndgrChatUserId(chat);
    if (!uid) continue;
    const text = normalizeCommentText(chat.content);
    if (!text) continue;
    const commentNo = String(chat.no);
    /** @type {{ commentNo: string, text: string, userId: string, nickname?: string }} */
    const row = { commentNo, text, userId: uid };
    const nick = String(chat.name || '').trim();
    if (nick) row.nickname = nick;
    out.push(row);
  }
  return out;
}
