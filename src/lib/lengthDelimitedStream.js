import { readUint32Varint } from './protobufVarint.js';

/**
 * length-delimited（varint 長 + ペイロード）の連続を分割する。
 * 末尾が varint／ペイロードの途中で切れている場合は、確定したフレームだけ返し **残りバイトを tail として返す**。
 *
 * @param {Uint8Array} bytes
 * @returns {{ frames: Uint8Array[], tail: Uint8Array }}
 */
export function splitLengthDelimitedMessagesWithTail(bytes) {
  /** @type {Uint8Array[]} */
  const frames = [];
  let offset = 0;
  while (offset < bytes.length) {
    const vr = readUint32Varint(bytes, offset);
    if (!vr) break;
    const frameStart = offset + vr.length;
    const frameEnd = frameStart + vr.value;
    if (frameEnd > bytes.length) break;
    frames.push(bytes.subarray(frameStart, frameEnd));
    offset = frameEnd;
  }
  const tail =
    offset < bytes.length ? bytes.subarray(offset) : new Uint8Array(0);
  return { frames, tail };
}

/**
 * @param {Uint8Array[]} parts
 * @returns {Uint8Array}
 */
export function concatUint8Arrays(parts) {
  let len = 0;
  for (const p of parts) len += p.length;
  const out = new Uint8Array(len);
  let o = 0;
  for (const p of parts) {
    out.set(p, o);
    o += p.length;
  }
  return out;
}

/**
 * fetch ReadableStream 等で分割された NDGR バイナリを連結して length-delimited フレームを取り出す。
 *
 * @param {{ maxPendingBytes?: number }} [options]
 */
export function createLengthDelimitedStreamAccumulator(options = {}) {
  const maxPending = Math.max(
    4096,
    Math.min(Number(options.maxPendingBytes) || 2_000_000, 8_000_000)
  );
  /** @type {Uint8Array} */
  let pending = new Uint8Array(0);
  let droppedBytes = 0;
  let totalFrames = 0;

  return {
    /**
     * @param {Uint8Array} chunk
     * @param {(frame: Uint8Array) => void} onFrame
     */
    push(chunk, onFrame) {
      if (!chunk?.length) return;
      let combined =
        pending.length === 0
          ? chunk
          : concatUint8Arrays([pending, chunk]);
      if (combined.length > maxPending) {
        const over = combined.length - maxPending;
        droppedBytes += over;
        combined = combined.subarray(combined.length - maxPending);
      }
      const { frames, tail } = splitLengthDelimitedMessagesWithTail(combined);
      pending = tail.length ? new Uint8Array(tail) : new Uint8Array(0);
      for (const fr of frames) {
        totalFrames += 1;
        onFrame(fr);
      }
    },

    getStats() {
      return {
        pendingBytes: pending.length,
        droppedBytes,
        totalFrames
      };
    },

    reset() {
      pending = new Uint8Array(0);
      droppedBytes = 0;
      totalFrames = 0;
    }
  };
}

/**
 * バッファ全体を length-delimited（varint 長 + ペイロード）の連続として分割する。
 * 末尾が途中で切れている場合は **確定したメッセージだけ**返し残りは捨てる（後方互換）。
 *
 * @param {Uint8Array} bytes
 * @returns {Uint8Array[]}
 */
export function splitLengthDelimitedMessages(bytes) {
  return splitLengthDelimitedMessagesWithTail(bytes).frames;
}
