/**
 * 複合シグナルによる同時接続数推定モジュール。
 *
 * ニコ生には同時接続 API がないため、複数の統計指標から推定する。
 *
 * Signal A: アクティブコメンター法
 *   直近5分のユニークコメンター数 × 動的倍率
 *   倍率は来場者数に応じて上昇（大規模配信ほどコメント参加率が下がるため）
 *
 * Signal B: 滞留率法
 *   累計来場者数 × 時間経過による滞留率
 *   指数減衰モデル: rate = max(0.08, 0.48 × exp(-0.005 × ageMin))
 *
 * 統合: 幾何平均 √(A × B) で両シグナルの偏りを中和
 *
 * 較正データ（ちくわちゃんランキングpoints ≈ 同時接続の代理指標として使用）:
 *   でかもも: 30 active, 2580 visitors → 305 pts → m ≈ 10
 *   あかねこ: 60 active, 8754 visitors → 929 pts → m ≈ 15
 */

/** @type {number} */
export const DEFAULT_WINDOW_MS = 5 * 60 * 1000;

/**
 * 動的倍率テーブル（来場者数 → 倍率）
 * ちくわちゃんランキングとの較正に基づく。
 *
 * 較正: でかもも(2580→m≈10), あかねこ(8754→m≈15)
 * 外挿: lurker effect により大規模ほど倍率上昇
 *
 * @type {ReadonlyArray<readonly [number, number]>}
 */
const MULTIPLIER_TABLE = /** @type {const} */ ([
  [50, 4],
  [200, 5],
  [500, 6],
  [1000, 7],
  [3000, 10],
  [8000, 15],
  [20000, 20],
  [50000, 25],
]);

/**
 * active_only モード時の来場者比率ソフトキャップ。
 * streamAge 不明の場合、推定値が visitors × この値を超えないようにする。
 * 高エンゲージメント配信での過大推定を防ぐ安全弁。
 * @type {number}
 */
const VISITOR_SOFT_CAP_RATIO = 0.35;

/**
 * 来場者数から動的倍率を算出（対数補間）。
 * @param {number|undefined|null} totalVisitors
 * @returns {number}
 */
export function dynamicMultiplier(totalVisitors) {
  if (typeof totalVisitors !== 'number' || !Number.isFinite(totalVisitors) || totalVisitors <= 0) {
    return 7;
  }
  const T = MULTIPLIER_TABLE;
  if (totalVisitors <= T[0][0]) return T[0][1];
  if (totalVisitors >= T[T.length - 1][0]) return T[T.length - 1][1];

  for (let i = 0; i < T.length - 1; i++) {
    if (totalVisitors <= T[i + 1][0]) {
      const [v0, m0] = T[i];
      const [v1, m1] = T[i + 1];
      const t = (Math.log(totalVisitors) - Math.log(v0)) / (Math.log(v1) - Math.log(v0));
      return Math.round((m0 + t * (m1 - m0)) * 10) / 10;
    }
  }
  return 7;
}

/**
 * 配信経過時間から滞留率を算出。
 * 指数減衰: rate = max(floor, peak × exp(-decay × ageMin))
 *
 * 0分: 48%, 30分: 41%, 60分: 35%, 120分: 26%, 180分: 20%, 300分: 11%
 *
 * @param {number} ageMin  配信開始からの経過分数
 * @returns {number} 0–1 の滞留率
 */
export function retentionRate(ageMin) {
  if (typeof ageMin !== 'number' || !Number.isFinite(ageMin) || ageMin < 0) return 0.40;
  return Math.max(0.08, 0.48 * Math.exp(-0.005 * ageMin));
}

/**
 * タイムスタンプ付き userId Map から、指定ウィンドウ内のアクティブユーザー数を返す。
 *
 * @param {ReadonlyMap<string, number>} userTimestamps  userId → lastSeenAt (ms)
 * @param {number} now  現在時刻 (ms)
 * @param {number} [windowMs]  ウィンドウ幅 (ms)。省略時 5 分
 * @returns {number} ウィンドウ内のユニークユーザー数
 */
export function countRecentActiveUsers(userTimestamps, now, windowMs) {
  const w = typeof windowMs === 'number' && windowMs > 0 ? windowMs : DEFAULT_WINDOW_MS;
  const cutoff = now - w;
  let count = 0;
  for (const ts of userTimestamps.values()) {
    if (ts >= cutoff) count++;
  }
  return count;
}

/**
 * @typedef {{
 *   estimated: number,
 *   activeCommenters: number,
 *   multiplier: number,
 *   capped: boolean,
 *   method: 'combined'|'active_only'|'retention_only'|'none',
 *   signalA: number,
 *   signalB: number,
 *   retentionPct: number|null,
 *   streamAgeMin: number|null
 * }} ConcurrentEstimateResult
 */

/**
 * 複合シグナルで推定同時接続数を計算する。
 *
 * @param {object} params
 * @param {number} params.recentActiveUsers  直近5分のユニークコメンター数
 * @param {number} [params.totalVisitors]    来場者数（倍率計算 + キャップに使用）
 * @param {number} [params.streamAgeMin]     配信経過分数（滞留推定に使用）
 * @param {number} [params.multiplier]       倍率を手動指定する場合（省略時は動的算出）
 * @returns {ConcurrentEstimateResult}
 */
export function estimateConcurrentViewers({
  recentActiveUsers,
  totalVisitors,
  streamAgeMin,
  multiplier
}) {
  const active = typeof recentActiveUsers === 'number' && recentActiveUsers >= 0
    ? Math.floor(recentActiveUsers)
    : 0;

  const hasVisitors = typeof totalVisitors === 'number' && Number.isFinite(totalVisitors) && totalVisitors > 0;
  const hasAge = typeof streamAgeMin === 'number' && Number.isFinite(streamAgeMin) && streamAgeMin >= 0;

  const m = typeof multiplier === 'number' && multiplier > 0
    ? multiplier
    : dynamicMultiplier(hasVisitors ? totalVisitors : null);

  const signalA = active > 0 ? active * m : 0;

  let signalB = 0;
  let retPct = /** @type {number|null} */ (null);
  if (hasVisitors && hasAge) {
    retPct = retentionRate(/** @type {number} */ (streamAgeMin));
    signalB = Math.round(/** @type {number} */ (totalVisitors) * retPct);
  }

  let estimated = 0;
  /** @type {'combined'|'active_only'|'retention_only'|'none'} */
  let method = 'none';

  if (signalA > 0 && signalB > 0) {
    estimated = Math.round(Math.sqrt(signalA * signalB));
    method = 'combined';
  } else if (signalA > 0) {
    estimated = Math.round(signalA);
    method = 'active_only';
  } else if (signalB > 0) {
    estimated = signalB;
    method = 'retention_only';
  }

  let capped = false;
  if (hasVisitors) {
    if (method === 'active_only') {
      const softCap = Math.round(/** @type {number} */ (totalVisitors) * VISITOR_SOFT_CAP_RATIO);
      if (estimated > softCap) {
        estimated = softCap;
        capped = true;
      }
    }
    if (estimated > /** @type {number} */ (totalVisitors)) {
      estimated = /** @type {number} */ (totalVisitors);
      capped = true;
    }
  }

  return {
    estimated,
    activeCommenters: active,
    multiplier: m,
    capped,
    method,
    signalA: Math.round(signalA),
    signalB,
    retentionPct: retPct != null ? Math.round(retPct * 100) : null,
    streamAgeMin: hasAge ? /** @type {number} */ (streamAgeMin) : null,
  };
}
