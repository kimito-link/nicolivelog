/**
 * 応援グリッド用タイル画像 URL の優先解決（純関数）
 */

/**
 * @param {unknown} url
 * @returns {boolean}
 */
export function isHttpOrHttpsUrl(url) {
  const s = String(url || '').trim();
  return /^https?:\/\//i.test(s);
}

/**
 * 数字のユーザーIDから、ニコニコで広く使われる usericon CDN の URL を組み立てる。
 * DOM に img が無い行でも ID だけ取れていればタイルに他者アイコンを出せる。
 * 未設定アカウント等では 404 になり得る（ブラウザは既定の壊れ画像表示）。
 *
 * @param {unknown} userId
 * @returns {string} 組み立て不可時は空
 */
export function niconicoDefaultUserIconUrl(userId) {
  const s = String(userId || '').trim();
  if (!/^\d{5,14}$/.test(s)) return '';
  const n = Number(s);
  if (!Number.isFinite(n) || n < 1) return '';
  const bucket = Math.max(1, Math.floor(n / 10000));
  return `https://secure-dcdn.cdn.nimg.jp/nicoaccount/usericon/s/${bucket}/${s}.jpg`;
}

/**
 * @param {{
 *   entryAvatarUrl?: string|null,
 *   userId?: string|null,
 *   isOwnPosted?: boolean,
 *   viewerAvatarUrl?: string|null,
 *   defaultSrc: string
 * }} p
 * @returns {string}
 */
export function resolveSupportGrowthTileSrc(p) {
  const def = String(p.defaultSrc || '');
  if (isHttpOrHttpsUrl(p.entryAvatarUrl)) {
    return String(p.entryAvatarUrl).trim();
  }
  const derived = niconicoDefaultUserIconUrl(p.userId);
  if (isHttpOrHttpsUrl(derived)) {
    return derived;
  }
  if (p.isOwnPosted && isHttpOrHttpsUrl(p.viewerAvatarUrl)) {
    return String(p.viewerAvatarUrl).trim();
  }
  return def;
}

/**
 * 識別ユーザーレーン用: https サムネがあれば表示に使い、無ければ拡張内既定タイル。
 * @param {unknown} httpCandidate storyGrowthAvatarSrcCandidate 等の戻り（http(s) のみ）
 * @param {unknown} defaultTileSrc 例: STORY_GRID_DEFAULT_TILE_IMG
 * @returns {string}
 */
export function pickUserLaneDisplayTileSrc(httpCandidate, defaultTileSrc) {
  if (isHttpOrHttpsUrl(httpCandidate)) return String(httpCandidate).trim();
  return String(defaultTileSrc || '').trim();
}

/**
 * 表示タイルが既定に揃っても衝突しないユーザーレーン用の重複排除キー。
 * @param {{ userId?: unknown, avatarHttpCandidate?: unknown, stableId?: unknown }} p
 * @returns {string} 空ならレーンに載せない
 */
export function userLaneDedupeKey(p) {
  const u = String(p?.userId || '').trim();
  if (u) return `u:${u}`;
  if (isHttpOrHttpsUrl(p?.avatarHttpCandidate)) {
    return `t:${String(p.avatarHttpCandidate).trim()}`;
  }
  const s = String(p?.stableId || '').trim();
  if (s) return `s:${s}`;
  return '';
}
