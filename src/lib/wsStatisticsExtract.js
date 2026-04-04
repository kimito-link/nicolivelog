/**
 * 視聴セッション WebSocket の JSON メッセージから statistics（viewers / comments）を抽出する。
 *
 * ニコ生の視聴セッション WS (wss://a.live2.nicovideo.jp/wsapi/v2/watch/...)
 * は定期的に以下の形式のメッセージを送信する:
 *   {"type":"statistics","data":{"viewers":41,"comments":1}}
 * 新形式では watchCount / commentCount 等の可能性もある。
 */

const MAX_VIEWERS = 50_000_000;
const VIEWER_KEYS = ['viewers', 'watchCount', 'watching', 'watchingCount', 'viewerCount', 'viewCount'];
const COMMENT_KEYS = ['comments', 'commentCount'];

/**
 * @param {Record<string, unknown>} d
 * @returns {number | null}
 */
function pickViewerValue(d) {
  for (const k of VIEWER_KEYS) {
    const raw = d[k];
    if (raw == null) continue;
    const n = typeof raw === 'number' ? raw : parseInt(String(raw), 10);
    if (Number.isFinite(n) && n >= 0 && n <= MAX_VIEWERS) return n;
  }
  return null;
}

/**
 * @param {Record<string, unknown>} d
 * @returns {number | null}
 */
function pickCommentValue(d) {
  for (const k of COMMENT_KEYS) {
    const raw = d[k];
    if (raw == null) continue;
    const n = typeof raw === 'number' ? raw : parseInt(String(raw), 10);
    if (Number.isFinite(n) && n >= 0) return n;
  }
  return null;
}

/**
 * パース済みオブジェクトから statistics を抽出する。
 * type:"statistics" 以外でも、既知の viewer キーがあれば抽出を試みる。
 * @param {unknown} obj
 * @returns {{ viewers: number, comments: number|null } | null}
 */
export function extractStatisticsFromParsedObject(obj) {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return null;
  const o = /** @type {Record<string, unknown>} */ (obj);

  const data = o.data;
  const target =
    data && typeof data === 'object' && !Array.isArray(data)
      ? /** @type {Record<string, unknown>} */ (data)
      : o;

  const viewers = pickViewerValue(target);
  if (viewers != null) return { viewers, comments: pickCommentValue(target) };

  if (target !== o) {
    const v2 = pickViewerValue(o);
    if (v2 != null) return { viewers: v2, comments: pickCommentValue(o) };
  }
  return null;
}

/**
 * JSON 文字列から statistics を抽出する。
 * @param {string} json
 * @returns {{ viewers: number, comments: number|null } | null}
 */
export function extractStatisticsFromWsJson(json) {
  if (!json || typeof json !== 'string') return null;
  try {
    const obj = JSON.parse(json);
    return extractStatisticsFromParsedObject(obj);
  } catch {
    return null;
  }
}
