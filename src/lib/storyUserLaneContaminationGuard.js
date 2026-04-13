/**
 * 応援ユーザーレーン候補から、視聴者/配信者 UID の混入を除外する判定。
 * 自己投稿（selfPosted or recents 照合済み）は除外しない。
 *
 * @param {{
 *   candidateUserId: string,
 *   viewerUserId?: string,
 *   broadcasterUserId?: string,
 *   isOwnPosted?: boolean
 * }} opts
 * @returns {boolean} true のとき候補を除外する
 */
export function shouldSkipStoryUserLaneCandidateByContamination(opts) {
  const uid = String(opts.candidateUserId || '').trim();
  if (!uid) return true;
  if (opts.isOwnPosted) return false;
  const viewerUid = String(opts.viewerUserId || '').trim();
  if (viewerUid && uid === viewerUid) return true;
  const broadcasterUid = String(opts.broadcasterUserId || '').trim();
  if (broadcasterUid && uid === broadcasterUid) return true;
  return false;
}
