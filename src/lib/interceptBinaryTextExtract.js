/** バイナリを UTF-8 として解釈した文字列から、近傍の commentNo とユーザー識別子の組を拾う（ヒューリスティック）。 */

const MAX_PAIR_DISTANCE = 600;

const UID_RE =
  /"(?:user_id|userId|uid|hashed_user_id|hashedUserId|raw_user_id)"\s*:\s*"?(\w{5,26})"?/g;
const NO_RE = /"(?:no|commentNo|comment_no)"\s*:\s*(\d+)/g;

/**
 * @param {string} text
 * @returns {{ no: string, uid: string }[]}
 */
export function extractPairsFromBinaryUtf8(text) {
  if (!text || text.length < 4) return [];

  /** @type {{ val: string, pos: number }[]} */
  const uids = [];
  /** @type {{ val: string, pos: number }[]} */
  const nos = [];

  let m;
  const uidRe = new RegExp(UID_RE.source, 'g');
  while ((m = uidRe.exec(text)) !== null) {
    uids.push({ val: m[1], pos: m.index });
  }
  const noRe = new RegExp(NO_RE.source, 'g');
  while ((m = noRe.exec(text)) !== null) {
    nos.push({ val: m[1], pos: m.index });
  }

  if (!uids.length || !nos.length) return [];

  /** @type {{ no: string, uid: string }[]} */
  const out = [];
  for (const u of uids) {
    let best = null;
    let bestDist = Infinity;
    for (const n of nos) {
      const dist = Math.abs(u.pos - n.pos);
      if (dist < bestDist) {
        bestDist = dist;
        best = n;
      }
    }
    if (best && bestDist < MAX_PAIR_DISTANCE) {
      out.push({ no: best.val, uid: u.val });
    }
  }
  return out;
}
