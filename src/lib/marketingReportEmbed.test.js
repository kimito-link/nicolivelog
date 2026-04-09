import { describe, it, expect } from 'vitest';
import {
  buildMarketingEmbedScriptInnerText,
  cloneReportForJsonEmbed
} from './marketingReportEmbed.js';

/** @returns {import('./marketingAggregate.js').MarketingReport} */
function tinyReport() {
  return {
    liveId: 'lv9',
    totalComments: 2,
    uniqueUsers: 1,
    avgCommentsPerUser: 2,
    medianCommentsPerUser: 2,
    peakMinute: 0,
    peakMinuteCount: 2,
    durationMinutes: 1,
    commentsPerMinute: 2,
    topUsers: [
      {
        userId: '12345678',
        nickname: 'AliceTest',
        avatarUrl: 'https://example.com/a.jpg',
        count: 2,
        firstAt: 1,
        lastAt: 2
      }
    ],
    timeline: [{ minute: 0, count: 2, uniqueUsers: 1 }],
    segmentCounts: { heavy: 0, mid: 0, light: 0, once: 1 },
    segmentPcts: { heavy: 0, mid: 0, light: 0, once: 100 },
    hourDistribution: new Array(24).fill(0),
    textStats: {
      avgChars: 1,
      medianChars: 1,
      withUrlCount: 0,
      withEmojiCount: 0,
      pctWithUrl: 0,
      pctWithEmoji: 0
    },
    selfPostedCount: 0,
    selfPostedPct: 0,
    is184: { count184: 0, knownCount: 0, pctOfKnown: 0 },
    timelineCumulative: [2],
    timelineRolling5Min: [2],
    maxSilenceGapMs: 0,
    vposThirds: null,
    quarterEngagement: {
      uniqueCommentersFirstQuarter: 1,
      uniqueCommentersLastQuarter: 1,
      uniqueCommentersBothQuarters: 1,
      skippedShortSpan: false
    }
  };
}

describe('marketingReportEmbed', () => {
  it('cloneReportForJsonEmbed は伏せ字で userId/nickname を短くし avatar を空にする', () => {
    const r = tinyReport();
    const out = cloneReportForJsonEmbed(r, true);
    expect(out.topUsers[0].nickname).not.toContain('Alice');
    expect(out.topUsers[0].avatarUrl).toBe('');
    expect(out.topUsers[0].userId).not.toBe('12345678');
  });

  it('buildMarketingEmbedScriptInnerText はパース可能で < をエスケープする', () => {
    const r = tinyReport();
    r.topUsers[0].nickname = 'a<script>x</script>';
    const inner = buildMarketingEmbedScriptInnerText(r, { maskShareLabels: false });
    expect(inner).not.toContain('<script>');
    const p = JSON.parse(inner);
    expect(p.schemaVersion).toBe(1);
    expect(p.report.liveId).toBe('lv9');
  });
});
