import { describe, it, expect } from 'vitest';
import { buildMarketingDashboardHtml } from './marketingChartsHtml.js';

/** @returns {import('./marketingAggregate.js').MarketingReport} */
function minimal() {
  return {
    liveId: 'lv123',
    totalComments: 50,
    uniqueUsers: 10,
    avgCommentsPerUser: 5,
    medianCommentsPerUser: 3,
    peakMinute: 5,
    peakMinuteCount: 12,
    durationMinutes: 30,
    commentsPerMinute: 1.7,
    topUsers: [
      { userId: 'u1', nickname: 'Alice', avatarUrl: '', count: 15, firstAt: 0, lastAt: 1 },
      { userId: 'u2', nickname: '', avatarUrl: 'https://example.com/av.jpg', count: 8, firstAt: 0, lastAt: 1 }
    ],
    timeline: Array.from({ length: 30 }, (_, i) => ({
      minute: i,
      count: i === 5 ? 12 : 2,
      uniqueUsers: i === 5 ? 8 : 1
    })),
    segmentCounts: { heavy: 2, mid: 3, light: 2, once: 3 },
    segmentPcts: { heavy: 20, mid: 30, light: 20, once: 30 },
    hourDistribution: new Array(24).fill(0).map((_, i) => (i >= 20 && i <= 23 ? 10 : 1))
  };
}

describe('buildMarketingDashboardHtml', () => {
  it('完全な HTML ドキュメントを返す', () => {
    const html = buildMarketingDashboardHtml(minimal());
    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('lv123');
  });

  it('KPI セクションが含まれる', () => {
    const html = buildMarketingDashboardHtml(minimal());
    expect(html).toContain('KPI サマリ');
    expect(html).toContain('50');
  });

  it('タイムラインの SVG が含まれる', () => {
    const html = buildMarketingDashboardHtml(minimal());
    expect(html).toContain('コメントタイムライン');
    expect(html).toContain('<svg');
    expect(html).toContain('<polyline');
  });

  it('セグメント円グラフが含まれる', () => {
    const html = buildMarketingDashboardHtml(minimal());
    expect(html).toContain('ユーザーセグメント');
    expect(html).toContain('ヘビー');
  });

  it('トップコメンターが含まれる', () => {
    const html = buildMarketingDashboardHtml(minimal());
    expect(html).toContain('トップコメンター');
    expect(html).toContain('Alice');
  });

  it('時間帯ヒートマップが含まれる', () => {
    const html = buildMarketingDashboardHtml(minimal());
    expect(html).toContain('時間帯ヒートマップ');
    expect(html).toContain('mkt-hour');
  });

  it('XSS: liveId にタグが入ってもエスケープされる', () => {
    const r = minimal();
    r.liveId = '<script>alert(1)</script>';
    const html = buildMarketingDashboardHtml(r);
    expect(html).not.toContain('<script>alert');
    expect(html).toContain('&lt;script&gt;');
  });
});
