import { readUint32Varint } from './protobufVarint.js';

/**
 * バッファ全体を length-delimited（varint 長 + ペイロード）の連続として分割する。
 * 末尾が varint／ペイロードの途中で切れている場合は、**確定したメッセージだけ**返し残りは捨てる。
 *
 * @param {Uint8Array} bytes
 * @returns {Uint8Array[]}
 */
export function splitLengthDelimitedMessages(bytes) {
  if (!bytes.length) return [];
  const out = [];
  let offset = 0;
  while (offset < bytes.length) {
    const vr = readUint32Varint(bytes, offset);
    if (!vr) break;
    offset += vr.length;
    const len = vr.value;
    if (offset + len > bytes.length) break;
    out.push(bytes.subarray(offset, offset + len));
    offset += len;
  }
  return out;
}
