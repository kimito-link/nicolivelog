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
