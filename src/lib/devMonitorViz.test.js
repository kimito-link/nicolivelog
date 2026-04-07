import { describe, expect, it } from 'vitest';
import {
  buildDevMonitorDlChartsHtml,
  commentTypeDistribution,
  commentTypeKeyLabelJa,
  htmlRecordOfficialGapStack,
  officialVsRecordedBarState,
  profileGapBarSeries,
  wsStalenessState
} from './devMonitorViz.js';

describe('officialVsRecordedBarState', () => {
  it('公式が無いときは neutral', () => {
    expect(officialVsRecordedBarState({ displayCount: 10, officialCount: null })).toMatchObject({
      tone: 'neutral',
      fillPct: 100
    });
  });

  it('公式に対して記録が十分なら ok', () => {
    expect(officialVsRecordedBarState({ displayCount: 100, officialCount: 100 })).toMatchObject({
      tone: 'ok',
      fillPct: 100
    });
  });

  it('欠落が大きいと bad', () => {
    expect(officialVsRecordedBarState({ displayCount: 50, officialCount: 100 })).toMatchObject({
      tone: 'bad',
      fillPct: 50
    });
  });
});

describe('profileGapBarSeries', () => {
  it('最大件数を 100% にスケールする', () => {
    const gaps = {
      numericUidWithHttpAvatar: 10,
      numericUidWithoutHttpAvatar: 5,
      anonStyleUidWithHttpAvatar: 0,
      anonStyleUidWithoutHttpAvatar: 0,
      numericWithNickname: 8,
      numericWithoutNickname: 2,
      anonWithNickname: 0,
      anonWithoutNickname: 0
    };
    const s = profileGapBarSeries(gaps);
    expect(s[0].pct).toBe(100);
    expect(s[1].pct).toBe(50);
  });
});

describe('commentTypeDistribution', () => {
  it('件数降順・構成比を返す', () => {
    const d = commentTypeDistribution({ a: 1, b: 9, z: 0 });
    expect(d.map((x) => x.key)).toEqual(['b', 'a']);
    expect(d[0].pct).toBeCloseTo(90, 5);
  });
});

describe('commentTypeKeyLabelJa', () => {
  it('既知キーを日本語化', () => {
    expect(commentTypeKeyLabelJa('gift')).toBe('ギフト');
    expect(commentTypeKeyLabelJa('normal')).toBe('通常');
    expect(commentTypeKeyLabelJa('operator')).toBe('運営');
  });
});

describe('wsStalenessState', () => {
  it('新しいほど鮮度が高い', () => {
    expect(wsStalenessState(0).tone).toBe('ok');
    expect(wsStalenessState(120_000).freshnessPct).toBe(0);
  });
});

describe('htmlRecordOfficialGapStack', () => {
  it('記録と差を積み上げで示す', () => {
    const h = htmlRecordOfficialGapStack(80, 100);
    expect(h).toContain('記録 80');
    expect(h).toContain('未取り込み 20');
  });
});

describe('buildDevMonitorDlChartsHtml', () => {
  it('liveId なしは空', () => {
    expect(
      buildDevMonitorDlChartsHtml({
        liveId: '',
        displayCount: 0,
        storageCount: 0,
        snapshot: null,
        avatarStats: null
      })
    ).toBe('');
  });

  it('アバター内訳・公式・intercept を含む', () => {
    const h = buildDevMonitorDlChartsHtml({
      liveId: 'lv1',
      displayCount: 10,
      storageCount: 10,
      snapshot: {
        officialCommentCount: 20,
        _debug: { intercept: 5 }
      },
      avatarStats: {
        total: 3,
        withHttpAvatar: 1,
        withoutHttpAvatar: 2,
        withNickname: 1,
        withoutNickname: 2,
        numericUserId: 2,
        nonNumericUserId: 1,
        missingUserId: 0
      }
    });
    expect(h).toContain('nl-dev-monitor-dl-charts');
    expect(h).toContain('ページ側メモ');
    expect(h).toContain('公式');
  });
});
