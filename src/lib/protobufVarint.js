/**
 * Protobuf の非負 varint を読み取る（length-delimited の長さ用）。
 * 値が uint32 を超える場合や 10 バイトを超えて続く場合は null。
 *
 * @param {Uint8Array} bytes
 * @param {number} offset
 * @returns {{ value: number, length: number } | null}
 */
export function readUint32Varint(bytes, offset) {
  if (offset < 0 || offset >= bytes.length) return null;
  let result = 0n;
  let shift = 0n;
  let o = offset;
  for (let i = 0; i < 10; i += 1) {
    const b = bytes[o];
    if (b === undefined) return null;
    o += 1;
    result |= BigInt(b & 0x7f) << shift;
    if (result > 0xffffffffn) return null;
    if ((b & 0x80) === 0) {
      return { value: Number(result), length: o - offset };
    }
    shift += 7n;
  }
  return null;
}
