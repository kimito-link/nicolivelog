/**
 * 開発監視トレンド: sessionStorage（セッション）+ chrome.storage.local（永続・最大7日）
 */

import { devMonitorTrendStorageKey } from './storageKeys.js';

const STORAGE_PREFIX = 'nl-dev-monitor-trend:';
const MAX_SESSION_POINTS = 24;
const MAX_PERSISTED_POINTS = 250;
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * @typedef {{
 *   t: number,
 *   thumb: number,
 *   idPct: number,
 *   nick: number,
 *   comment: number,
 *   displayCount?: number,
 *   storageCount?: number
 * }} DevMonitorTrendPoint
 */

/**
 * @param {string} liveId
 * @returns {string}
 */
function sessionKeyFor(liveId) {
  return `${STORAGE_PREFIX}${String(liveId || '').trim() || '_'}`;
}

/**
 * @param {unknown} raw
 * @returns {DevMonitorTrendPoint[]}
 */
export function parseTrendJsonArray(raw) {
  if (typeof raw !== 'string' || !raw) return [];
  try {
    const p = JSON.parse(raw);
    return Array.isArray(p) ? p.filter(Boolean) : [];
  } catch {
    return [];
  }
}

/**
 * @param {DevMonitorTrendPoint[]} points
 * @param {number} maxPoints
 * @param {number} maxAgeMs
 * @param {number} nowMs
 * @returns {DevMonitorTrendPoint[]}
 */
export function trimTrendByAgeAndCap(points, maxPoints, maxAgeMs, nowMs) {
  const cutoff = nowMs - maxAgeMs;
  const fresh = points.filter(
    (pt) =>
      pt &&
      typeof pt.t === 'number' &&
      Number.isFinite(pt.t) &&
      pt.t >= cutoff
  );
  fresh.sort((a, b) => a.t - b.t);
  /** @type {Map<number, DevMonitorTrendPoint>} */
  const byT = new Map();
  for (const pt of fresh) {
    byT.set(pt.t, pt);
  }
  const deduped = Array.from(byT.values()).sort((a, b) => a.t - b.t);
  return deduped.slice(-maxPoints);
}

/**
 * @param {DevMonitorTrendPoint[]} a
 * @param {DevMonitorTrendPoint[]} b
 * @returns {DevMonitorTrendPoint[]}
 */
export function mergeTrendArrays(a, b) {
  return trimTrendByAgeAndCap(
    [...a, ...b],
    MAX_PERSISTED_POINTS,
    MAX_AGE_MS,
    Date.now()
  );
}

/**
 * @param {typeof globalThis} win
 * @param {string} liveId
 * @returns {DevMonitorTrendPoint[]}
 */
export function readTrendSeries(win, liveId) {
  try {
    const raw = win.sessionStorage.getItem(sessionKeyFor(liveId));
    return parseTrendJsonArray(raw);
  } catch {
    return [];
  }
}

/**
 * @param {typeof globalThis} win
 * @param {string} liveId
 * @param {{
 *   thumb: number,
 *   idPct: number,
 *   nick: number,
 *   commentPct: number|null,
 *   displayCount?: number,
 *   storageCount?: number
 * }} sample
 */
export function appendTrendPoint(win, liveId, sample) {
  const lid = String(liveId || '').trim();
  if (!lid) return;
  const prev = readTrendSeries(win, lid);
  const comm =
    sample.commentPct != null && Number.isFinite(sample.commentPct)
      ? Math.max(0, Math.min(100, sample.commentPct))
      : 0;
  const now = Date.now();
  /** @type {DevMonitorTrendPoint} */
  const pt = {
    t: now,
    thumb: Math.max(0, Math.min(100, sample.thumb)),
    idPct: Math.max(0, Math.min(100, sample.idPct)),
    nick: Math.max(0, Math.min(100, sample.nick)),
    comment: comm
  };
  if (typeof sample.displayCount === 'number' && Number.isFinite(sample.displayCount)) {
    pt.displayCount = Math.max(0, Math.floor(sample.displayCount));
  }
  if (typeof sample.storageCount === 'number' && Number.isFinite(sample.storageCount)) {
    pt.storageCount = Math.max(0, Math.floor(sample.storageCount));
  }
  const next = trimTrendByAgeAndCap(
    [...prev, pt],
    MAX_SESSION_POINTS,
    MAX_AGE_MS,
    now
  );
  try {
    win.sessionStorage.setItem(sessionKeyFor(lid), JSON.stringify(next));
  } catch {
    // quota / private mode
  }
}

/**
 * chrome.storage.local に追記（ポップアップから void で呼ぶ）
 * @param {string} liveId
 * @param {{
 *   thumb: number,
 *   idPct: number,
 *   nick: number,
 *   commentPct: number|null,
 *   displayCount?: number,
 *   storageCount?: number
 * }} sample
 * @returns {Promise<void>}
 */
export async function persistTrendPointChrome(liveId, sample) {
  const lid = String(liveId || '').trim();
  if (!lid) return;
  const key = devMonitorTrendStorageKey(lid);
  const chromeObj =
    typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local
      ? chrome.storage.local
      : null;
  if (!chromeObj) return;

  const comm =
    sample.commentPct != null && Number.isFinite(sample.commentPct)
      ? Math.max(0, Math.min(100, sample.commentPct))
      : 0;
  const now = Date.now();
  /** @type {DevMonitorTrendPoint} */
  const pt = {
    t: now,
    thumb: Math.max(0, Math.min(100, sample.thumb)),
    idPct: Math.max(0, Math.min(100, sample.idPct)),
    nick: Math.max(0, Math.min(100, sample.nick)),
    comment: comm
  };
  if (typeof sample.displayCount === 'number' && Number.isFinite(sample.displayCount)) {
    pt.displayCount = Math.max(0, Math.floor(sample.displayCount));
  }
  if (typeof sample.storageCount === 'number' && Number.isFinite(sample.storageCount)) {
    pt.storageCount = Math.max(0, Math.floor(sample.storageCount));
  }

  const bag = await new Promise((resolve) => {
    try {
      chromeObj.get(key, (r) => resolve(r && typeof r === 'object' ? r : {}));
    } catch {
      resolve({});
    }
  });
  const prev = parseTrendJsonArray(bag[key]);
  const merged = trimTrendByAgeAndCap(
    [...prev, pt],
    MAX_PERSISTED_POINTS,
    MAX_AGE_MS,
    now
  );
  await new Promise((resolve) => {
    try {
      chromeObj.set({ [key]: JSON.stringify(merged) }, () => resolve(undefined));
    } catch {
      resolve(undefined);
    }
  });
}

/**
 * @param {typeof globalThis} win
 * @param {string} liveId
 * @returns {Promise<DevMonitorTrendPoint[]>}
 */
export async function readMergedTrendSeries(win, liveId) {
  const lid = String(liveId || '').trim();
  if (!lid) return [];
  const sess = readTrendSeries(win, lid);
  const chromeObj =
    typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local
      ? chrome.storage.local
      : null;
  if (!chromeObj) return mergeTrendArrays(sess, []);

  const key = devMonitorTrendStorageKey(lid);
  const bag = await new Promise((resolve) => {
    try {
      chromeObj.get(key, (r) => resolve(r && typeof r === 'object' ? r : {}));
    } catch {
      resolve({});
    }
  });
  const persisted = parseTrendJsonArray(bag[key]);
  return mergeTrendArrays(sess, persisted);
}

/**
 * @param {DevMonitorTrendPoint[]} points
 * @returns {{
 *   thumbSeries: number[],
 *   idSeries: number[],
 *   nickSeries: number[],
 *   commentSeries: number[],
 *   displaySeries: number[],
 *   storageSeries: number[]
 * }}
 */
export function trendToSparklineArrays(points) {
  return {
    thumbSeries: points.map((p) => p.thumb),
    idSeries: points.map((p) => p.idPct),
    nickSeries: points.map((p) => p.nick),
    commentSeries: points.map((p) => p.comment),
    displaySeries: points.map((p) =>
      typeof p.displayCount === 'number' ? p.displayCount : 0
    ),
    storageSeries: points.map((p) =>
      typeof p.storageCount === 'number' ? p.storageCount : 0
    )
  };
}

/**
 * @param {DevMonitorTrendPoint[]} points
 * @returns {boolean}
 */
export function trendHasCountSamples(points) {
  return points.some(
    (p) =>
      (typeof p.displayCount === 'number' && p.displayCount >= 0) ||
      (typeof p.storageCount === 'number' && p.storageCount >= 0)
  );
}
