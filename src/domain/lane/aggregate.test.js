/**
 * domain/lane/aggregate.js の契約テスト。
 *
 * 旧 userLaneCandidatesFromStorage.test.js の「純粋集約部分」の契約を
 * 新インターフェース（avatarObservationKinds / hasNonCanonicalPersonalUrl）で再表明する。
 */

import { describe, expect, it } from 'vitest';
import { aggregateLaneCandidates } from './aggregate.js';

const CANON_URL =
  'https://secure-dcdn.cdn.nimg.jp/nicoaccount/usericon/s/13203/132035068.jpg';
const EXT_URL = 'https://example.cdn.example.com/a.png';

describe('aggregateLaneCandidates: 入力形', () => {
  it('null/undefined/非配列は空配列を返す', () => {
    expect(aggregateLaneCandidates(null)).toEqual([]);
    expect(aggregateLaneCandidates(undefined)).toEqual([]);
    expect(aggregateLaneCandidates(/** @type {any} */ ('not-array'))).toEqual([]);
  });

  it('userId 空の行は無視される', () => {
    const out = aggregateLaneCandidates([
      { userId: '', nickname: 'x', capturedAt: 1 },
      { userId: '132035068', nickname: 'のら', capturedAt: 2 }
    ]);
    expect(out.length).toBe(1);
    expect(out[0].userId).toBe('132035068');
  });
});

describe('aggregateLaneCandidates: 1 userId に複数行', () => {
  it('kinds は union される', () => {
    const out = aggregateLaneCandidates([
      {
        userId: '132035068',
        nickname: 'レコ',
        capturedAt: 10,
        avatarObservationKinds: new Set(['stored'])
      },
      {
        userId: '132035068',
        nickname: 'レコ',
        capturedAt: 20,
        avatarObservationKinds: new Set(['dom', 'ndgr-entry'])
      }
    ]);
    expect(out.length).toBe(1);
    const k = out[0].avatarObservationKinds;
    expect(k.has('dom')).toBe(true);
    expect(k.has('ndgr-entry')).toBe(true);
    expect(k.has('stored')).toBe(true);
    expect(k.size).toBe(3);
  });

  it('hasNonCanonicalPersonalUrl は 1 行でも true なら true', () => {
    const out = aggregateLaneCandidates([
      {
        userId: '132035068',
        capturedAt: 10,
        hasNonCanonicalPersonalUrl: false
      },
      {
        userId: '132035068',
        capturedAt: 20,
        hasNonCanonicalPersonalUrl: true
      }
    ]);
    expect(out[0].hasNonCanonicalPersonalUrl).toBe(true);
  });

  it('avatarUrl は最新行の非空値を優先', () => {
    const out = aggregateLaneCandidates([
      { userId: '132035068', capturedAt: 10, avatarUrl: EXT_URL },
      { userId: '132035068', capturedAt: 20, avatarUrl: '' },
      { userId: '132035068', capturedAt: 30, avatarUrl: CANON_URL }
    ]);
    expect(out[0].avatarUrl).toBe(CANON_URL);
  });

  it('最新行 avatarUrl が空で古い行にあれば古い方を拾う', () => {
    const out = aggregateLaneCandidates([
      { userId: '132035068', capturedAt: 10, avatarUrl: EXT_URL },
      { userId: '132035068', capturedAt: 20, avatarUrl: '' }
    ]);
    expect(out[0].avatarUrl).toBe(EXT_URL);
  });

  it('強い nick を最新から拾う（弱い nick は飛ばす）', () => {
    const out = aggregateLaneCandidates([
      { userId: '132035068', capturedAt: 10, nickname: 'たろう' },
      { userId: '132035068', capturedAt: 20, nickname: 'user12ABCd' },
      { userId: '132035068', capturedAt: 30, nickname: '' }
    ]);
    expect(out[0].nickname).toBe('たろう');
  });

  it('強い nick が無ければ最新 nick（弱くても）を表示用に返す', () => {
    const out = aggregateLaneCandidates([
      { userId: '132035068', capturedAt: 10, nickname: 'user12ABCd' },
      { userId: '132035068', capturedAt: 20, nickname: '匿名' }
    ]);
    expect(out[0].nickname).toBe('匿名');
  });

  it('lastCapturedAt は最大値', () => {
    const out = aggregateLaneCandidates([
      { userId: '132035068', capturedAt: 10 },
      { userId: '132035068', capturedAt: 50 },
      { userId: '132035068', capturedAt: 30 }
    ]);
    expect(out[0].lastCapturedAt).toBe(50);
  });

  it('liveId は最新行のものを採用', () => {
    const out = aggregateLaneCandidates([
      { userId: '132035068', capturedAt: 10, liveId: 'lv111' },
      { userId: '132035068', capturedAt: 20, liveId: 'lv222' }
    ]);
    expect(out[0].liveId).toBe('lv222');
  });

  it('liveId 欠落時は lvId にフォールバック', () => {
    const out = aggregateLaneCandidates([
      { userId: '132035068', capturedAt: 10, lvId: 'lv333' }
    ]);
    expect(out[0].liveId).toBe('lv333');
  });
});

describe('aggregateLaneCandidates: 複数 userId', () => {
  it('lastCapturedAt で降順ソート', () => {
    const out = aggregateLaneCandidates([
      { userId: '111111111', capturedAt: 10 },
      { userId: '222222222', capturedAt: 30 },
      { userId: '333333333', capturedAt: 20 }
    ]);
    expect(out.map((r) => r.userId)).toEqual([
      '222222222',
      '333333333',
      '111111111'
    ]);
  });

  it('kinds が配列でも Set でも受け付ける', () => {
    const out = aggregateLaneCandidates([
      {
        userId: '132035068',
        capturedAt: 10,
        avatarObservationKinds: ['dom']
      },
      {
        userId: '132035068',
        capturedAt: 20,
        avatarObservationKinds: new Set(['stored'])
      }
    ]);
    expect(out[0].avatarObservationKinds.has('dom')).toBe(true);
    expect(out[0].avatarObservationKinds.has('stored')).toBe(true);
  });

  it('kinds 未指定行は空 Set として扱う（union に影響しない）', () => {
    const out = aggregateLaneCandidates([
      { userId: '132035068', capturedAt: 10 },
      {
        userId: '132035068',
        capturedAt: 20,
        avatarObservationKinds: new Set(['dom'])
      }
    ]);
    expect(out[0].avatarObservationKinds.has('dom')).toBe(true);
    expect(out[0].avatarObservationKinds.size).toBe(1);
  });
});
