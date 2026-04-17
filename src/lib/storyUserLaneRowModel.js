/**
 * 応援ユーザーレーン: 1 ユーザー候補あたりの tier・サムネ・ソート用スコアを一箇所で組み立てる。
 */

import { explainSupportGridDisplayTier } from './supportGridDisplayTier.js';
import {
  isAnonymousStyleNicoUserId,
  userLaneResolvedThumbScore
} from './supportGrowthTileSrc.js';
import {
  pickStoryUserLaneCellDisplaySrc,
  userLaneHttpForTilePick
} from './storyUserLaneDisplaySrc.js';

/**
 * 応援ユーザーレーンの並び順。大きいほど「個人サムネ＋表示名」に近い。
 *
 * レーン専用ルール（supportGrid より厳格、匿名は一切上段に上げない）:
 * - link(3):  非匿名 + 「個人サムネ確定」 ＝ avatarObserved=true（DOM / intercept で
 *             実際にアバター描画を観測）か、非合成の個人 URL（score>=2）
 * - konta(2): 非匿名 + 強い表示名あり + アバター未観測（URL が無い or 合成 canonical だけ）
 * - tanu(1):  それ以外（匿名 a:xxxx などはカスタム表示名や個人サムネがあっても全部ここ）
 *
 * 実装メモ:
 *   - ニコ生の個人サムネは大半が `secure-dcdn.cdn.nimg.jp/nicoaccount/usericon/s/<bucket>/<uid>.jpg`
 *     で配信されるが、この URL は `niconicoDefaultUserIconUrl(uid)` と形が完全一致するため
 *     `commentEnrichmentAvatarScore` は合成 canonical（score=1）と判定してしまう。
 *     この合成判定だけで「個人サムネ無し」扱いにすると、実在する個人アバターのユーザーも
 *     こん太(2) に落ちて りんく(3) が空になる（スクリーンショットで観測された症状）。
 *   - DOM / intercept 層が `avatarObserved` を立てた時点で「実物の画像が観測できた」ことが
 *     保証されるため、この関数でも avatarObserved=true を「個人サムネ確定」として優先扱いする。
 *
 * 旧実装の変遷:
 *   旧々（fix 前）: 「非匿名 + 強い表示名 + 個人サムネなし」を link に格上げし、かつ
 *                  「匿名 + 強い表示名 / 匿名 + 個人サムネ」を konta に混入させていた。
 *   旧（直前 fix）: 匿名は必ず tanu へ落とすよう厳格化。ただし avatarObserved を考慮せず
 *                  `ex.hasPersonalThumb`（URL スコア>=2）のみで判定したため、合成 canonical
 *                  URL（ニコ生の大多数の個人サムネ）が個人扱いされず link が実質空になった。
 *
 * @param {{ userId?: unknown, nickname?: unknown, avatarUrl?: unknown, avatarObserved?: boolean }|null|undefined} entry
 * @param {string} httpAvatarCandidate storyGrowth と stored をマージした `userLaneHttpForTilePick` 結果推奨（表示セルと段を一致させる）
 * @returns {0|1|2|3}
 */
export function userLaneProfileCompletenessTier(entry, httpAvatarCandidate) {
  const uid = String(entry?.userId || '').trim();
  if (!uid) return 0;
  // 匿名 (a:xxxx, ハッシュ風 ID 等) は強ニック・個人サムネ・avatarObserved があっても
  // 上段には出さず、必ず たぬ姉(1) に落とす。レーン専用の厳格ルール。
  if (isAnonymousStyleNicoUserId(uid)) return 1;
  const observed = Boolean(entry?.avatarObserved);
  const ex = explainSupportGridDisplayTier({
    userId: uid,
    nickname: String(entry?.nickname || '').trim(),
    httpAvatarCandidate: String(httpAvatarCandidate ?? '').trim(),
    storedAvatarUrl: String(entry?.avatarUrl || '').trim(),
    avatarObserved: observed
  });
  // 非匿名 + 実アバター観測済み → link（合成 canonical URL でも実物が見えたなら個人扱い）
  if (observed) return 3;
  // 非匿名 + 非合成個人 URL → link（まだ DOM 観測できていなくても URL 形式で個人と分かる）
  if (ex.hasPersonalThumb) return 3;
  // 非匿名 + 強い表示名だがアバター未観測 → こん太（暫定段）
  if (ex.strongNick) return 2;
  return 1;
}

/**
 * @typedef {{
 *   yukkuriSrc: string,
 *   tvSrc: string,
 *   anonymousIdenticonEnabled: boolean,
 *   anonymousIdenticonDataUrl?: string
 * }} StoryUserLanePickContext
 */

/**
 * @param {{ userId?: unknown, nickname?: unknown, avatarUrl?: unknown }|null|undefined} entry
 * @param {number} entryIndex
 * @param {string} httpFromGrowth storyGrowthAvatarSrcCandidate
 * @param {StoryUserLanePickContext} pickCtx
 * @returns {{ entryIndex: number, profileTier: number, thumbScore: number, displaySrc: string, httpForLane: string, entry: Record<string, unknown> } | null}
 */
export function buildStoryUserLaneCandidateRow(
  entry,
  entryIndex,
  httpFromGrowth,
  pickCtx
) {
  const uidRaw = String(entry?.userId || '').trim();
  if (!uidRaw) return null;
  const rawAvStored = String(entry?.avatarUrl || '').trim();
  const httpTrim = String(httpFromGrowth ?? '').trim();
  const httpForLane = userLaneHttpForTilePick(uidRaw, httpTrim, rawAvStored);
  const profileTier = userLaneProfileCompletenessTier(entry, httpForLane);
  const displaySrc = pickStoryUserLaneCellDisplaySrc({
    userId: entry?.userId,
    httpCandidate: httpForLane,
    profileTier,
    yukkuriSrc: pickCtx.yukkuriSrc,
    tvSrc: pickCtx.tvSrc,
    identiconOpts: {
      anonymousIdenticonEnabled: pickCtx.anonymousIdenticonEnabled,
      anonymousIdenticonDataUrl: String(pickCtx.anonymousIdenticonDataUrl ?? '')
    }
  });
  if (!displaySrc) return null;
  const thumbScore = userLaneResolvedThumbScore(entry?.userId, httpForLane);
  return {
    entryIndex,
    profileTier,
    thumbScore,
    displaySrc,
    httpForLane,
    entry
  };
}
