/**
 * 応援ユーザーレーンの per-row → per-user 集約（純関数）。
 *
 * レイヤ: domain/ (pure)
 *
 * 責務:
 *   ・同一 userId の複数行を 1 つの候補にまとめる
 *   ・観測 kind の集合を union する（1 行でも dom で観測されていれば kinds に dom）
 *   ・表示名は「強いニックを最新で」優先して拾う
 *   ・最新 capturedAt を保持して、呼び出し側の並び替えキーに使う
 *
 * 呼び出し側（data/ 層）の責任:
 *   ・chrome.storage.local や intercept の読み出し
 *   ・liveId によるフィルタ / fallback
 *   ・取得した per-row に `avatarObservationKinds` Set を埋める
 *
 * この関数は storage / DOM / extension グローバル一切に触らない。
 * 入力が純粋な POJO 配列である限り、ブラウザ環境外でも動く。
 */

import { isStrongNickname } from '../user/nickname.js';

/**
 * @typedef {import('../user/avatar.js').AvatarObservationKind} AvatarObservationKind
 */

/**
 * @typedef {Object} LaneAggregateRow
 * @property {string} userId
 * @property {string} [nickname]
 * @property {string} [avatarUrl]
 *   表示用の URL（合成 canonical 含む）。per-row 単位。
 * @property {ReadonlySet<AvatarObservationKind>|AvatarObservationKind[]} [avatarObservationKinds]
 *   この行で観測された kinds。data 層が `resolveAvatarObservation` から渡す想定。
 * @property {boolean} [hasNonCanonicalPersonalUrl]
 *   この行に「合成 canonical ではない個人 URL」があったか。
 * @property {string} [liveId]
 * @property {string} [lvId]
 * @property {number} [capturedAt]
 */

/**
 * @typedef {Object} LaneCandidate
 * @property {string} userId
 * @property {string} nickname
 * @property {string} avatarUrl
 * @property {Set<AvatarObservationKind>} avatarObservationKinds
 * @property {boolean} hasNonCanonicalPersonalUrl
 * @property {string} liveId
 * @property {number} lastCapturedAt
 */

/**
 * 行オブジェクトから capturedAt を安全に取り出す。
 * @param {LaneAggregateRow|unknown} row
 * @returns {number}
 */
function rowCapturedAt(row) {
  const n = Number(/** @type {{ capturedAt?: unknown }} */ (row)?.capturedAt);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

/**
 * 行オブジェクトから liveId を取り出す（lvId フォールバック付き）。
 * @param {unknown} row
 * @returns {string}
 */
function rowLiveId(row) {
  const o = /** @type {{ liveId?: unknown, lvId?: unknown }} */ (row);
  return String(o?.liveId ?? o?.lvId ?? '').trim();
}

/**
 * kinds 入力（Set or Array or undefined）を Set に正規化する。
 * @param {unknown} v
 * @returns {Set<AvatarObservationKind>}
 */
function toKindSet(v) {
  if (v instanceof Set) return new Set(/** @type {Set<AvatarObservationKind>} */ (v));
  if (Array.isArray(v)) return new Set(/** @type {AvatarObservationKind[]} */ (v));
  return new Set();
}

/**
 * 同じ userId の複数行を 1 つの LaneCandidate にまとめる。
 * 表示 URL は「最新かつ空でない avatarUrl」を優先（data 側で
 * resolveAvatarObservation.displayAvatarUrl を詰めておけば自動的に整合する）。
 *
 * @param {string} userId
 * @param {readonly LaneAggregateRow[]} rows
 * @returns {LaneCandidate}
 */
function aggregateOneUser(userId, rows) {
  const chronological = [...rows].sort(
    (a, b) => rowCapturedAt(a) - rowCapturedAt(b)
  );
  const newestFirst = [...chronological].reverse();

  // 観測 kind の union
  /** @type {Set<AvatarObservationKind>} */
  const kinds = new Set();
  let nonCanonical = false;
  for (const r of chronological) {
    for (const k of toKindSet(r?.avatarObservationKinds)) kinds.add(k);
    if (r?.hasNonCanonicalPersonalUrl) nonCanonical = true;
  }

  // 表示 URL: 最新で http が入っている行を優先、なければ古い順で探す
  let avatarUrl = '';
  for (const r of newestFirst) {
    const u = String(r?.avatarUrl || '').trim();
    if (u) {
      avatarUrl = u;
      break;
    }
  }

  // 表示名: 強い nick を最新から、無ければ最新の nick（弱くても表示はする）
  let nickname = '';
  for (const r of newestFirst) {
    const n = String(r?.nickname || '').trim();
    if (isStrongNickname(n, userId)) {
      nickname = n;
      break;
    }
  }
  if (!nickname && newestFirst.length > 0) {
    nickname = String(newestFirst[0]?.nickname || '').trim();
  }

  const lastCapturedAt =
    chronological.length > 0 ? rowCapturedAt(chronological[chronological.length - 1]) : 0;
  const liveId = rowLiveId(newestFirst[0] || chronological[chronological.length - 1] || {});

  return {
    userId,
    nickname,
    avatarUrl,
    avatarObservationKinds: kinds,
    hasNonCanonicalPersonalUrl: nonCanonical,
    liveId,
    lastCapturedAt
  };
}

/**
 * 行配列を per-user 候補に集約し、最新順に並べて返す。
 * userId が空の行は除外する（候補として扱えない）。
 *
 * 凍結はしない（呼び出し側が必要に応じて Object.freeze する）。
 *
 * @param {readonly LaneAggregateRow[]|null|undefined} rows
 * @returns {LaneCandidate[]}
 */
export function aggregateLaneCandidates(rows) {
  const src = Array.isArray(rows) ? rows : [];
  /** @type {Map<string, LaneAggregateRow[]>} */
  const byUid = new Map();
  for (const r of src) {
    const uid = String(r?.userId || '').trim();
    if (!uid) continue;
    const g = byUid.get(uid);
    if (g) g.push(r);
    else byUid.set(uid, [r]);
  }

  const out = /** @type {LaneCandidate[]} */ ([]);
  for (const [uid, group] of byUid) {
    out.push(aggregateOneUser(uid, group));
  }
  out.sort((a, b) => b.lastCapturedAt - a.lastCapturedAt);
  return out;
}
