/**
 * domain/user/avatar.js の契約テスト。
 *
 * これらのテストは「観測信号と表示 URL の分離」を破ってきた
 * 過去の退行を封じる（docs/lane-architecture-redesign.md §2.2）。
 */

import { describe, expect, it } from 'vitest';
import {
  resolveAvatarObservation,
  kindsFromLegacyObservedFlag
} from './avatar.js';

const CANON_URL_132035068 =
  'https://secure-dcdn.cdn.nimg.jp/nicoaccount/usericon/s/13203/132035068.jpg';
const EXT_URL =
  'https://example.cdn.example.com/avatars/132035068.png';

describe('resolveAvatarObservation: 基本', () => {
  it('入力が null/undefined でも落ちない', () => {
    const r = resolveAvatarObservation(null);
    expect(r.displayAvatarUrl).toBe('');
    expect(r.avatarObservationKinds.size).toBe(0);
    expect(r.hasNonCanonicalPersonalUrl).toBe(false);
  });

  it('観測なし + 数値 ID → canonical にフォールバック、kinds は空', () => {
    const r = resolveAvatarObservation({ userId: '132035068' });
    expect(r.displayAvatarUrl).toBe(CANON_URL_132035068);
    expect(r.avatarObservationKinds.size).toBe(0);
    expect(r.hasNonCanonicalPersonalUrl).toBe(false);
  });

  it('観測なし + 匿名 ID → displayAvatarUrl は空', () => {
    const r = resolveAvatarObservation({ userId: 'a:AbCdEfGh' });
    expect(r.displayAvatarUrl).toBe('');
    expect(r.avatarObservationKinds.size).toBe(0);
  });

  it('dom で観測 → kinds に "dom" が入る / displayAvatarUrl は dom 値', () => {
    const r = resolveAvatarObservation({
      userId: '132035068',
      dom: EXT_URL
    });
    expect(r.displayAvatarUrl).toBe(EXT_URL);
    expect(r.avatarObservationKinds.has('dom')).toBe(true);
    expect(r.avatarObservationKinds.size).toBe(1);
    expect(r.hasNonCanonicalPersonalUrl).toBe(true);
  });

  it('観測 URL が合成 canonical でも kinds は立つ（観測事実は記録）', () => {
    const r = resolveAvatarObservation({
      userId: '132035068',
      ndgrEntry: CANON_URL_132035068
    });
    expect(r.avatarObservationKinds.has('ndgr-entry')).toBe(true);
    // ただし「非合成」フラグは立たない
    expect(r.hasNonCanonicalPersonalUrl).toBe(false);
  });

  it('複数ソースで観測 → kinds 複数 / display は優先順', () => {
    const r = resolveAvatarObservation({
      userId: '132035068',
      dom: EXT_URL,
      ndgrEntry: CANON_URL_132035068,
      stored: CANON_URL_132035068
    });
    expect(r.displayAvatarUrl).toBe(EXT_URL); // dom が最優先
    expect(r.avatarObservationKinds.has('dom')).toBe(true);
    expect(r.avatarObservationKinds.has('ndgr-entry')).toBe(true);
    expect(r.avatarObservationKinds.has('stored')).toBe(true);
    expect(r.hasNonCanonicalPersonalUrl).toBe(true); // dom が非合成
  });

  it('dom 以外に値があるとき dom が空でもフォールバック順で選ばれる', () => {
    const r = resolveAvatarObservation({
      userId: '132035068',
      ndgrMap: EXT_URL,
      stored: CANON_URL_132035068
    });
    expect(r.displayAvatarUrl).toBe(EXT_URL);
    expect(r.avatarObservationKinds.has('ndgr-map')).toBe(true);
    expect(r.avatarObservationKinds.has('stored')).toBe(true);
  });

  it('live-api から取れた URL も kinds に記録される', () => {
    const r = resolveAvatarObservation({
      userId: '132035068',
      liveApi: CANON_URL_132035068
    });
    expect(r.avatarObservationKinds.has('live-api')).toBe(true);
  });

  it('http でない値（空文字・相対パス）は無視される', () => {
    const r = resolveAvatarObservation({
      userId: '132035068',
      dom: '',
      ndgrEntry: '/relative/path.jpg',
      stored: 'data:image/png;base64,AAA'
    });
    expect(r.avatarObservationKinds.size).toBe(0);
    // 観測ゼロ → canonical フォールバック
    expect(r.displayAvatarUrl).toBe(CANON_URL_132035068);
  });
});

describe('kindsFromLegacyObservedFlag: 旧 boolean との互換', () => {
  it('true → {dom}', () => {
    const k = kindsFromLegacyObservedFlag(true);
    expect(k.size).toBe(1);
    expect(k.has('dom')).toBe(true);
  });
  it('false → 空 Set', () => {
    const k = kindsFromLegacyObservedFlag(false);
    expect(k.size).toBe(0);
  });
});
