/**
 * NDGR (のどぐろ) Protobuf 軽量デコーダー
 *
 * ニコ生メッセージサーバーの Length-Delimited Protobuf Stream から
 * Statistics (同時接続数) と Chat (commentNo + userId) を抽出する。
 *
 * Proto schema reference:
 *   ChunkedMessage.state  (field 4) → NicoliveState.statistics (field 1) → Statistics
 *   ChunkedMessage.message(field 2) → NicoliveMessage.chat     (field 1) → Chat
 *
 * Statistics fields: viewers(1), comments(2), ad_points(3), gift_points(4)
 * Chat fields: content(1), name(2), vpos(3), account_status(4),
 *              raw_user_id(5), hashed_user_id(6), modifier(7), no(8)
 */

/**
 * @param {Uint8Array} buf
 * @param {number} off
 * @returns {[number, number]|null} [value, nextOffset]
 */
export function pbVarint(buf, off) {
  let v = 0, s = 0;
  for (let i = off; i < buf.length; i++) {
    const b = buf[i];
    v += (b & 0x7f) * (2 ** s);
    s += 7;
    if (!(b & 0x80)) return [v, i + 1];
    if (s > 56) return null;
  }
  return null;
}

/**
 * @callback PbFieldCb
 * @param {number} fieldNum
 * @param {number} wireType  0=varint, 2=LEN
 * @param {number|null} val  varint 値 (wireType===0 の場合)
 * @param {number} start     LEN の開始オフセット (wireType===2 の場合)
 * @param {number} end       LEN の終了オフセット (wireType===2 の場合)
 * @returns {void}
 */

/**
 * @param {Uint8Array} buf
 * @param {number} start
 * @param {number} end
 * @param {PbFieldCb} cb
 */
export function pbForEach(buf, start, end, cb) {
  let o = start;
  while (o < end) {
    const t = pbVarint(buf, o);
    if (!t) break;
    o = t[1];
    const fn = t[0] >>> 3, wt = t[0] & 7;
    if (wt === 0) {
      const v = pbVarint(buf, o);
      if (!v) break;
      cb(fn, 0, v[0], o, v[1]);
      o = v[1];
    } else if (wt === 2) {
      const l = pbVarint(buf, o);
      if (!l) break;
      const s = l[1], e = l[1] + l[0];
      if (e > end) break;
      cb(fn, 2, null, s, e);
      o = e;
    } else if (wt === 1) {
      o += 8;
      if (o > end) break;
    } else if (wt === 5) {
      o += 4;
      if (o > end) break;
    } else {
      break;
    }
  }
}

/**
 * @typedef {{ viewers: number|null, comments: number|null, adPoints: number|null, giftPoints: number|null }} NdgrStatistics
 */

/**
 * @param {Uint8Array} buf
 * @param {number} start
 * @param {number} end
 * @returns {NdgrStatistics}
 */
export function decodeStatistics(buf, start, end) {
  let viewers = null, comments = null, adPoints = null, giftPoints = null;
  pbForEach(buf, start, end, (fn, wt, val) => {
    if (wt !== 0) return;
    if (fn === 1) viewers = val;
    if (fn === 2) comments = val;
    if (fn === 3) adPoints = val;
    if (fn === 4) giftPoints = val;
  });
  return { viewers, comments, adPoints, giftPoints };
}

/**
 * @typedef {{ no: number|null, rawUserId: number|null, hashedUserId: string, name: string, content: string, vpos: number|null, accountStatus: number|null, is184: boolean }} NdgrChat
 * @typedef {{ advertiserUserId: string, advertiserName: string }} NdgrGift
 */

const _dec = typeof TextDecoder !== 'undefined' ? new TextDecoder('utf-8', { fatal: false }) : null;
/** @param {Uint8Array} buf @param {number} s @param {number} e */
function decodeStr(buf, s, e) {
  if (!_dec) return '';
  try { return _dec.decode(buf.subarray(s, e)); } catch { return ''; }
}

/**
 * @param {Uint8Array} buf
 * @param {number} start
 * @param {number} end
 * @returns {NdgrChat}
 */
export function decodeChat(buf, start, end) {
  let no = null, rawUserId = null, hashedUserId = '', name = '', content = '';
  let vpos = /** @type {number|null} */ (null);
  let accountStatus = /** @type {number|null} */ (null);
  let is184 = false;
  pbForEach(buf, start, end, (fn, wt, val, s, e) => {
    if (fn === 8 && wt === 0) no = val;
    if (fn === 5 && wt === 0) rawUserId = val;
    if (fn === 6 && wt === 2) hashedUserId = decodeStr(buf, s, e);
    if (fn === 2 && wt === 2) name = decodeStr(buf, s, e);
    if (fn === 1 && wt === 2) content = decodeStr(buf, s, e);
    if (fn === 3 && wt === 0) vpos = val;
    if (fn === 4 && wt === 0) accountStatus = val;
    if (fn === 7 && wt === 2) {
      pbForEach(buf, s, e, (mfn, mwt, mval) => {
        if (mfn === 1 && mwt === 0) is184 = Boolean(mval);
      });
    }
  });
  return { no, rawUserId, hashedUserId, name, content, vpos, accountStatus, is184 };
}

/**
 * NicoliveMessage oneof の Gift（field 8 想定）を軽量デコード。proto 差異に耐えるため LEN 文字列を走査する。
 *
 * @param {Uint8Array} buf
 * @param {number} start
 * @param {number} end
 * @returns {NdgrGift}
 */
export function decodeGift(buf, start, end) {
  let advertiserUserId = '';
  let advertiserName = '';
  /** @type {string[]} */
  const strs = [];
  pbForEach(buf, start, end, (fn, wt, val, s, e) => {
    if (wt === 2) {
      const str = decodeStr(buf, s, e);
      if (str) strs.push(str);
      if (fn === 2 && str) advertiserName = advertiserName || str;
      if (fn === 1 && str && /^\d{5,14}$/.test(str)) {
        advertiserUserId = advertiserUserId || str;
      }
    } else if (wt === 0 && val != null) {
      const vs = String(val);
      if (/^\d{5,14}$/.test(vs)) advertiserUserId = advertiserUserId || vs;
    }
  });
  for (const str of strs) {
    if (!advertiserUserId && /^\d{5,14}$/.test(str)) advertiserUserId = str;
  }
  if (!advertiserName) {
    for (const str of strs) {
      if (
        str !== advertiserUserId &&
        str.length > 0 &&
        str.length <= 128 &&
        !/^https?:\/\//i.test(str)
      ) {
        advertiserName = str;
        break;
      }
    }
  }
  return { advertiserUserId, advertiserName };
}

/**
 * @typedef {{ stats: NdgrStatistics|null, chats: NdgrChat[], gifts: NdgrGift[] }} NdgrDecodeResult
 */

/**
 * 1件の ChunkedMessage をデコードして統計情報とチャットを返す
 * @param {Uint8Array} buf
 * @param {number} [start]
 * @param {number} [end]
 * @returns {NdgrDecodeResult}
 */
export function decodeChunkedMessage(buf, start, end) {
  const s0 = start ?? 0;
  const e0 = end ?? buf.length;
  /** @type {NdgrStatistics|null} */
  let stats = null;
  /** @type {NdgrChat[]} */
  const chats = [];
  /** @type {NdgrGift[]} */
  const gifts = [];

  pbForEach(buf, s0, e0, (fn, wt, _v, s, e) => {
    if (wt !== 2) return;

    if (fn === 4) {
      pbForEach(buf, s, e, (sfn, swt, _sv, ss, se) => {
        if (sfn === 1 && swt === 2) {
          stats = decodeStatistics(buf, ss, se);
        }
      });
    }

    if (fn === 2) {
      pbForEach(buf, s, e, (mfn, mwt, _mv, ms, me) => {
        if (mwt !== 2) return;
        if (mfn === 1 || mfn === 20) {
          const chat = decodeChat(buf, ms, me);
          if (chat.no != null) chats.push(chat);
        } else if (mfn === 8) {
          const g = decodeGift(buf, ms, me);
          if (g.advertiserUserId || g.advertiserName) gifts.push(g);
        }
      });
    }
  });

  return { stats, chats, gifts };
}

/**
 * PackedSegment (field 1 = repeated ChunkedMessage) をデコード
 * @param {Uint8Array} buf
 * @param {number} [start]
 * @param {number} [end]
 * @returns {NdgrDecodeResult[]}
 */
export function decodePackedSegment(buf, start, end) {
  const s0 = start ?? 0;
  const e0 = end ?? buf.length;
  /** @type {NdgrDecodeResult[]} */
  const results = [];
  pbForEach(buf, s0, e0, (fn, wt, _v, s, e) => {
    if (fn === 1 && wt === 2) {
      results.push(decodeChunkedMessage(buf, s, e));
    }
  });
  return results;
}
