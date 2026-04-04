import { describe, it, expect } from 'vitest';
import {
  pbVarint,
  pbForEach,
  decodeStatistics,
  decodeChat,
  decodeChunkedMessage,
  decodePackedSegment
} from './ndgrDecode.js';

function encodeVarint(value) {
  const bytes = [];
  let v = value;
  while (v > 0x7f) {
    bytes.push((v & 0x7f) | 0x80);
    v = Math.floor(v / 128);
  }
  bytes.push(v & 0x7f);
  return bytes;
}

function tag(fieldNum, wireType) {
  return encodeVarint((fieldNum << 3) | wireType);
}

function lenDelimited(fieldNum, payload) {
  return [...tag(fieldNum, 2), ...encodeVarint(payload.length), ...payload];
}

function varintField(fieldNum, value) {
  return [...tag(fieldNum, 0), ...encodeVarint(value)];
}

function strField(fieldNum, str) {
  const enc = new TextEncoder();
  const bytes = enc.encode(str);
  return lenDelimited(fieldNum, [...bytes]);
}

describe('pbVarint', () => {
  it('decodes single-byte varint', () => {
    const buf = new Uint8Array([0x08]);
    expect(pbVarint(buf, 0)).toEqual([8, 1]);
  });

  it('decodes multi-byte varint', () => {
    const buf = new Uint8Array([0xAC, 0x02]);
    expect(pbVarint(buf, 0)).toEqual([300, 2]);
  });

  it('returns null for truncated varint', () => {
    const buf = new Uint8Array([0x80]);
    expect(pbVarint(buf, 0)).toBeNull();
  });
});

describe('pbForEach', () => {
  it('iterates varint and LEN fields', () => {
    const payload = new Uint8Array([
      ...varintField(1, 42),
      ...strField(2, 'hello')
    ]);
    const fields = [];
    pbForEach(payload, 0, payload.length, (fn, wt, val, s, e) => {
      fields.push({ fn, wt, val, s, e });
    });
    expect(fields.length).toBe(2);
    expect(fields[0].fn).toBe(1);
    expect(fields[0].wt).toBe(0);
    expect(fields[0].val).toBe(42);
    expect(fields[1].fn).toBe(2);
    expect(fields[1].wt).toBe(2);
  });
});

describe('decodeStatistics', () => {
  it('decodes viewers and comments', () => {
    const buf = new Uint8Array([
      ...varintField(1, 523),
      ...varintField(2, 1200),
      ...varintField(3, 5000),
      ...varintField(4, 8000)
    ]);
    const stats = decodeStatistics(buf, 0, buf.length);
    expect(stats.viewers).toBe(523);
    expect(stats.comments).toBe(1200);
    expect(stats.adPoints).toBe(5000);
    expect(stats.giftPoints).toBe(8000);
  });

  it('handles partial statistics', () => {
    const buf = new Uint8Array(varintField(1, 100));
    const stats = decodeStatistics(buf, 0, buf.length);
    expect(stats.viewers).toBe(100);
    expect(stats.comments).toBeNull();
  });
});

describe('decodeChat', () => {
  it('decodes chat with raw_user_id', () => {
    const buf = new Uint8Array([
      ...strField(1, 'こんにちは'),
      ...varintField(3, 12345),
      ...varintField(5, 86255751),
      ...varintField(8, 42)
    ]);
    const chat = decodeChat(buf, 0, buf.length);
    expect(chat.no).toBe(42);
    expect(chat.rawUserId).toBe(86255751);
    expect(chat.content).toBe('こんにちは');
  });

  it('decodes chat with hashed_user_id', () => {
    const buf = new Uint8Array([
      ...strField(1, 'test'),
      ...strField(6, 'abc123def456'),
      ...varintField(8, 99)
    ]);
    const chat = decodeChat(buf, 0, buf.length);
    expect(chat.no).toBe(99);
    expect(chat.hashedUserId).toBe('abc123def456');
    expect(chat.rawUserId).toBeNull();
  });

  it('decodes chat with name', () => {
    const buf = new Uint8Array([
      ...strField(1, 'hello'),
      ...strField(2, 'ユーザー名'),
      ...varintField(5, 12345),
      ...varintField(8, 10)
    ]);
    const chat = decodeChat(buf, 0, buf.length);
    expect(chat.name).toBe('ユーザー名');
  });
});

describe('decodeChunkedMessage', () => {
  it('decodes statistics from state field', () => {
    const statistics = new Uint8Array([
      ...varintField(1, 523),
      ...varintField(2, 1200)
    ]);
    const nicoliveState = new Uint8Array(lenDelimited(1, [...statistics]));
    const chunkedMessage = new Uint8Array(lenDelimited(4, [...nicoliveState]));

    const result = decodeChunkedMessage(chunkedMessage);
    expect(result.stats).not.toBeNull();
    expect(result.stats.viewers).toBe(523);
    expect(result.stats.comments).toBe(1200);
    expect(result.chats.length).toBe(0);
  });

  it('decodes chat from message field', () => {
    const chat = new Uint8Array([
      ...strField(1, 'テスト'),
      ...varintField(5, 12345),
      ...varintField(8, 7)
    ]);
    const nicoliveMessage = new Uint8Array(lenDelimited(1, [...chat]));
    const chunkedMessage = new Uint8Array(lenDelimited(2, [...nicoliveMessage]));

    const result = decodeChunkedMessage(chunkedMessage);
    expect(result.stats).toBeNull();
    expect(result.chats.length).toBe(1);
    expect(result.chats[0].no).toBe(7);
    expect(result.chats[0].rawUserId).toBe(12345);
    expect(result.chats[0].content).toBe('テスト');
  });

  it('decodes overflowed_chat (field 20)', () => {
    const chat = new Uint8Array([
      ...strField(1, 'overflow'),
      ...strField(6, 'hashed123'),
      ...varintField(8, 50)
    ]);
    const nicoliveMessage = new Uint8Array(lenDelimited(20, [...chat]));
    const chunkedMessage = new Uint8Array(lenDelimited(2, [...nicoliveMessage]));

    const result = decodeChunkedMessage(chunkedMessage);
    expect(result.chats.length).toBe(1);
    expect(result.chats[0].no).toBe(50);
    expect(result.chats[0].hashedUserId).toBe('hashed123');
  });

  it('handles message with both stats and chat', () => {
    const statistics = new Uint8Array([
      ...varintField(1, 100),
      ...varintField(2, 500)
    ]);
    const state = new Uint8Array(lenDelimited(1, [...statistics]));
    const chat = new Uint8Array([
      ...strField(1, 'hi'),
      ...varintField(5, 999),
      ...varintField(8, 3)
    ]);
    const message = new Uint8Array(lenDelimited(1, [...chat]));
    const chunkedMessage = new Uint8Array([
      ...lenDelimited(4, [...state]),
      ...lenDelimited(2, [...message])
    ]);

    const result = decodeChunkedMessage(chunkedMessage);
    expect(result.stats?.viewers).toBe(100);
    expect(result.chats.length).toBe(1);
    expect(result.chats[0].no).toBe(3);
  });
});

describe('decodePackedSegment', () => {
  it('decodes repeated ChunkedMessages', () => {
    const chat1 = new Uint8Array([
      ...strField(1, 'msg1'),
      ...varintField(5, 111),
      ...varintField(8, 1)
    ]);
    const msg1 = new Uint8Array(lenDelimited(1, [...chat1]));
    const cm1 = new Uint8Array(lenDelimited(2, [...msg1]));

    const chat2 = new Uint8Array([
      ...strField(1, 'msg2'),
      ...varintField(5, 222),
      ...varintField(8, 2)
    ]);
    const msg2 = new Uint8Array(lenDelimited(1, [...chat2]));
    const cm2 = new Uint8Array(lenDelimited(2, [...msg2]));

    const packed = new Uint8Array([
      ...lenDelimited(1, [...cm1]),
      ...lenDelimited(1, [...cm2])
    ]);

    const results = decodePackedSegment(packed);
    expect(results.length).toBe(2);
    expect(results[0].chats[0].no).toBe(1);
    expect(results[0].chats[0].rawUserId).toBe(111);
    expect(results[1].chats[0].no).toBe(2);
    expect(results[1].chats[0].rawUserId).toBe(222);
  });
});
