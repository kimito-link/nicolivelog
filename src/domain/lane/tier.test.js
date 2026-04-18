/**
 * domain/lane/tier.js の契約テスト。
 *
 * ここでは過去の全退行を「新構造の policy で封印できる」ことを示す。
 * 旧 `src/lib/storyUserLaneRowModel.test.js` の I1-I5 invariants と
 * 等価な表明を policy ベースに書き直した版。
 */

import { describe, expect, it } from 'vitest';
import { resolveLaneTier } from './tier.js';
import { matchesLinkPolicy } from './columns/linkPolicy.js';
import { matchesKontaPolicy } from './columns/kontaPolicy.js';
import { matchesTanuPolicy } from './columns/tanuPolicy.js';

describe('resolveLaneTier: 基本', () => {
  it('userId 空は 0（候補除外）', () => {
    expect(resolveLaneTier({ userId: '', nickname: 'のら' })).toBe(0);
    expect(resolveLaneTier({ userId: null, nickname: 'のら' })).toBe(0);
    expect(resolveLaneTier(null)).toBe(0);
    expect(resolveLaneTier(undefined)).toBe(0);
  });

  it('数値ID + avatarObserved=true → link(3)', () => {
    expect(
      resolveLaneTier({
        userId: '88210441',
        nickname: 'レコ',
        avatarObserved: true
      })
    ).toBe(3);
  });

  it('数値ID + avatarObservationKinds が 1 要素以上 → link(3)', () => {
    expect(
      resolveLaneTier({
        userId: '88210441',
        nickname: '',
        avatarObservationKinds: new Set(['dom'])
      })
    ).toBe(3);
  });

  it('数値ID + hasNonCanonicalPersonalUrl=true → link(3)', () => {
    expect(
      resolveLaneTier({
        userId: '88210441',
        nickname: '',
        hasNonCanonicalPersonalUrl: true
      })
    ).toBe(3);
  });

  it('数値ID + 強ニックのみ（観測なし・URL なし） → link(3)', () => {
    // 新設計の列別 policy では「ID + 名前」の組で link 昇格（今日の relaxation と整合）
    expect(
      resolveLaneTier({
        userId: '88210441',
        nickname: 'たろう',
        avatarObserved: false
      })
    ).toBe(3);
  });

  it('数値ID + 弱ニック（空）+ 観測なし → konta(2)', () => {
    expect(
      resolveLaneTier({
        userId: '88210441',
        nickname: '',
        avatarObserved: false
      })
    ).toBe(2);
  });

  it('数値ID + "匿名" のような占位ニック + 観測なし → konta(2)', () => {
    expect(
      resolveLaneTier({
        userId: '88210441',
        nickname: '匿名',
        avatarObserved: false
      })
    ).toBe(2);
  });

  it('数値ID + user12ABCd 形式の自動名 + 観測なし → konta(2)', () => {
    expect(
      resolveLaneTier({
        userId: '88210441',
        nickname: 'user12ABCd',
        avatarObserved: false
      })
    ).toBe(2);
  });

  it('a: 形式の匿名は strongNick / observed / personal URL が揃っても tanu(1)', () => {
    expect(
      resolveLaneTier({
        userId: 'a:AbCdEfGhIjKl',
        nickname: 'のら',
        avatarObserved: true,
        hasNonCanonicalPersonalUrl: true
      })
    ).toBe(1);
  });

  it('ハッシュ風 ID も匿名扱いで tanu(1)', () => {
    expect(
      resolveLaneTier({
        userId: 'KqwErTyUiOpAsDfGh',
        nickname: 'はち',
        avatarObserved: true
      })
    ).toBe(1);
  });
});

describe('列 policy の排他性（unit-testability）', () => {
  const numeric = '132035068';
  const anon = 'a:AbCdEfGh';

  it('tanuPolicy は匿名でのみ true', () => {
    expect(matchesTanuPolicy({ userId: anon })).toBe(true);
    expect(matchesTanuPolicy({ userId: numeric })).toBe(false);
    expect(matchesTanuPolicy({ userId: '' })).toBe(false);
  });

  it('linkPolicy は匿名を除外する', () => {
    expect(
      matchesLinkPolicy({
        userId: anon,
        nickname: 'name',
        avatarObserved: true
      })
    ).toBe(false);
  });

  it('kontaPolicy は匿名を除外する', () => {
    expect(
      matchesKontaPolicy({
        userId: anon,
        nickname: '',
        avatarObserved: false
      })
    ).toBe(false);
  });

  it('非匿名 + 観測も名前もない → link は false / konta は true', () => {
    const e = { userId: numeric, nickname: '', avatarObserved: false };
    expect(matchesLinkPolicy(e)).toBe(false);
    expect(matchesKontaPolicy(e)).toBe(true);
  });

  it('非匿名 + 強ニックだけ → link は true', () => {
    const e = { userId: numeric, nickname: 'たろう' };
    expect(matchesLinkPolicy(e)).toBe(true);
  });
});
