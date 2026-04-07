import { describe, it, expect } from 'vitest';
import { aggregateMarketingReport } from './marketingAggregate.js';

const BASE = Date.now() - 600_000;

function c(no, uid, text, offsetMs = 0, extra = {}) {
  return {
    id: `id-${no}`,
    liveId: 'lv1',
    commentNo: String(no),
    text,
    userId: uid,
    nickname: extra.nickname || '',
    avatarUrl: extra.avatarUrl || '',
    selfPosted: false,
    capturedAt: BASE + offsetMs
  };
}

describe('aggregateMarketingReport', () => {
  it('空配列で安全に返る', () => {
    const r = aggregateMarketingReport([], 'lv1');
    expect(r.totalComments).toBe(0);
    expect(r.uniqueUsers).toBe(0);
    expect(r.timeline.length).toBeGreaterThanOrEqual(1);
  });

  it('ユーザー別の集計・セグメント分類が正しい', () => {
    const comments = [
      ...Array.from({ length: 12 }, (_, i) => c(i, 'heavy1', `h${i}`, i * 10000)),
      ...Array.from({ length: 5 }, (_, i) => c(100 + i, 'mid1', `m${i}`, i * 10000)),
      c(200, 'light1', 'l1', 0),
      c(201, 'light1', 'l2', 10000),
      c(300, 'once1', 'o1', 0)
    ];
    const r = aggregateMarketingReport(comments, 'lv1');
    expect(r.totalComments).toBe(20);
    expect(r.uniqueUsers).toBe(4);
    expect(r.segmentCounts.heavy).toBe(1);
    expect(r.segmentCounts.mid).toBe(1);
    expect(r.segmentCounts.light).toBe(1);
    expect(r.segmentCounts.once).toBe(1);
    expect(r.topUsers[0].userId).toBe('heavy1');
    expect(r.topUsers[0].count).toBe(12);
  });

  it('別の liveId のコメントはフィルタされる', () => {
    const comments = [
      c(1, 'u1', 'yes', 0),
      { ...c(2, 'u2', 'no', 0), liveId: 'lv999' }
    ];
    const r = aggregateMarketingReport(comments, 'lv1');
    expect(r.totalComments).toBe(1);
    expect(r.uniqueUsers).toBe(1);
  });

  it('タイムラインのピーク検出', () => {
    const comments = [
      ...Array.from({ length: 20 }, (_, i) => c(i, `u${i % 5}`, `t${i}`, 120_000)),
      c(50, 'u0', 'early', 0)
    ];
    const r = aggregateMarketingReport(comments, 'lv1');
    expect(r.peakMinuteCount).toBe(20);
    expect(r.peakMinute).toBe(2);
  });

  it('nickname と avatarUrl を最後に見つけた値で補完', () => {
    const comments = [
      c(1, 'u1', 'a', 0),
      c(2, 'u1', 'b', 1000, { nickname: 'Nick', avatarUrl: 'https://example.com/av.jpg' })
    ];
    const r = aggregateMarketingReport(comments, 'lv1');
    expect(r.topUsers[0].nickname).toBe('Nick');
    expect(r.topUsers[0].avatarUrl).toBe('https://example.com/av.jpg');
  });

  it('medianCommentsPerUser の計算', () => {
    const comments = [
      ...Array.from({ length: 10 }, (_, i) => c(i, 'many', `m${i}`, i * 1000)),
      c(100, 'once1', 'o', 0),
      c(101, 'once2', 'o', 0)
    ];
    const r = aggregateMarketingReport(comments, 'lv1');
    expect(r.medianCommentsPerUser).toBe(1);
  });
});
