import { describe, expect, it } from 'vitest';
import { readUint32Varint } from './protobufVarint.js';

describe('readUint32Varint', () => {
  it('returns 0 for single zero byte', () => {
    const u8 = new Uint8Array([0x00]);
    expect(readUint32Varint(u8, 0)).toEqual({ value: 0, length: 1 });
  });

  it('decodes 127 in one byte', () => {
    const u8 = new Uint8Array([0x7f]);
    expect(readUint32Varint(u8, 0)).toEqual({ value: 127, length: 1 });
  });

  it('decodes 128 in two bytes', () => {
    const u8 = new Uint8Array([0x80, 0x01]);
    expect(readUint32Varint(u8, 0)).toEqual({ value: 128, length: 2 });
  });

  it('decodes 300 (protobuf doc example)', () => {
    const u8 = new Uint8Array([0xac, 0x02]);
    expect(readUint32Varint(u8, 0)).toEqual({ value: 300, length: 2 });
  });

  it('respects offset', () => {
    const u8 = new Uint8Array([0xff, 0x80, 0x01]);
    expect(readUint32Varint(u8, 1)).toEqual({ value: 128, length: 2 });
  });

  it('returns null when buffer ends mid-varint', () => {
    const u8 = new Uint8Array([0x80]);
    expect(readUint32Varint(u8, 0)).toBeNull();
  });

  it('returns null when offset out of range', () => {
    const u8 = new Uint8Array([0x01]);
    expect(readUint32Varint(u8, 5)).toBeNull();
  });

  it('returns null for varint longer than 10 bytes (invalid)', () => {
    const u8 = new Uint8Array(12).fill(0x80);
    u8[11] = 0x01;
    expect(readUint32Varint(u8, 0)).toBeNull();
  });

  it('decodes maximum uint32 0xffffffff', () => {
    const u8 = new Uint8Array([0xff, 0xff, 0xff, 0xff, 0x0f]);
    expect(readUint32Varint(u8, 0)).toEqual({ value: 0xffffffff, length: 5 });
  });

  it('returns null when value exceeds 0xffffffff (2^32)', () => {
    /** uint64-style varint for 4294967296 = 0x100000000 */
    const u8 = new Uint8Array([0x80, 0x80, 0x80, 0x80, 0x10]);
    expect(readUint32Varint(u8, 0)).toBeNull();
  });
});
