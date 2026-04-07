/**
 * 応援ランキングストリップの DOM を組み直す必要があるか判定するキー。
 * 件数上位・ユーザー別件数が変わらないあいだは再描画をスキップし、プロフィール補完のたびの点滅を防ぐ。
 *
 * @param {string} liveId
 * @param {number} entryCount storage にあるコメント総数（増減検知用）
 * @param {{ userKey: string, count: number }[]} stripRooms ストリップに並べる行（先頭 N 件）
 * @returns {string}
 */
export function topSupportRankStripStableKey(liveId, entryCount, stripRooms) {
  const lid = String(liveId || '').trim().toLowerCase();
  const n = Math.max(0, Math.floor(Number(entryCount) || 0));
  const rows = Array.isArray(stripRooms) ? stripRooms : [];
  if (!rows.length) {
    return `${lid}\n${n}\n`;
  }
  const body = rows
    .map((r) => {
      const k = String(r?.userKey ?? '');
      const c = Math.max(0, Math.floor(Number(r?.count) || 0));
      return `${k}:${c}`;
    })
    .join('\n');
  return `${lid}\n${n}\n${body}`;
}
