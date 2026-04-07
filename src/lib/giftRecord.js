/**
 * ギフト/広告ユーザーの永続化（純関数）
 */

/**
 * @typedef {{ userId: string, nickname: string, capturedAt: number }} StoredGiftUser
 */

/**
 * @param {StoredGiftUser[]} existing
 * @param {{ userId: string, nickname?: string }[]} incoming
 * @returns {{ next: StoredGiftUser[], added: StoredGiftUser[], storageTouched: boolean }}
 */
export function mergeGiftUsers(existing, incoming) {
  /** @type {Map<string, StoredGiftUser>} */
  const byId = new Map();
  for (const e of existing) {
    byId.set(e.userId, e);
  }
  /** @type {StoredGiftUser[]} */
  const added = [];
  let storageTouched = false;
  const now = Date.now();

  for (const inc of incoming) {
    const uid = String(inc.userId || '').trim();
    if (!uid) continue;
    const nick = String(inc.nickname || '').trim();

    const ex = byId.get(uid);
    if (ex) {
      if (nick && !ex.nickname) {
        byId.set(uid, { ...ex, nickname: nick });
        storageTouched = true;
      }
      continue;
    }
    /** @type {StoredGiftUser} */
    const entry = { userId: uid, nickname: nick, capturedAt: now };
    byId.set(uid, entry);
    added.push(entry);
  }

  if (added.length) storageTouched = true;
  const next = [...byId.values()];
  return { next, added, storageTouched };
}
