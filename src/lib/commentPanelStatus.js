/**
 * コメントパネル検出失敗（DOM 変更等）をポップアップ向けに解釈する純関数
 */

/**
 * @param {unknown} raw
 * @returns {{ ok: false; updatedAt: number; liveId?: string; code?: string } | null}
 */
export function parseCommentPanelStatusPayload(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const o = /** @type {{ ok?: unknown; updatedAt?: unknown }} */ (raw);
  if (o.ok !== false) return null;
  const updatedAt = Number(o.updatedAt);
  if (!Number.isFinite(updatedAt)) return null;
  const liveId =
    'liveId' in o && o.liveId != null
      ? String(/** @type {{ liveId?: unknown }} */ (o).liveId).trim()
      : '';
  const code =
    'code' in o && o.code != null
      ? String(/** @type {{ code?: unknown }} */ (o).code).trim()
      : '';
  return {
    ok: false,
    updatedAt,
    ...(liveId ? { liveId } : {}),
    ...(code ? { code } : {})
  };
}

/**
 * @param {{ liveId?: string }} payload
 * @param {string|null|undefined} viewerLiveId
 * @returns {boolean}
 */
export function commentPanelStatusRelevantToLiveId(payload, viewerLiveId) {
  if (!payload || typeof payload !== 'object') return false;
  const errLid = String(
    /** @type {{ liveId?: unknown }} */ (payload).liveId || ''
  )
    .trim()
    .toLowerCase();
  if (!errLid) return true;
  const v = String(viewerLiveId || '')
    .trim()
    .toLowerCase();
  if (!v) return true;
  return errLid === v;
}
