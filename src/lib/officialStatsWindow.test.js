import { describe, expect, it } from 'vitest';
import { summarizeOfficialCommentHistory } from './officialStatsWindow.js';

describe('summarizeOfficialCommentHistory', () => {
  it('履歴から comments delta / received delta / capture ratio を返す', () => {
    const r = summarizeOfficialCommentHistory({
      history: [
        { at: 0, statisticsComments: 100, recordedComments: 60 },
        { at: 30_000, statisticsComments: 120, recordedComments: 72 },
        { at: 60_000, statisticsComments: 150, recordedComments: 84 }
      ],
      nowMs: 60_000,
      targetWindowMs: 60_000,
      minWindowMs: 15_000
    });
    expect(r).toEqual({
      previousStatisticsComments: 100,
      currentStatisticsComments: 150,
      receivedCommentsDelta: 24,
      statisticsCommentsDelta: 50,
      captureRatio: 0.48,
      sampleWindowMs: 60_000
    });
  });

  it('target window に満たなくても最小窓を満たす最古サンプルを使う', () => {
    const r = summarizeOfficialCommentHistory({
      history: [
        { at: 0, statisticsComments: 100, recordedComments: 50 },
        { at: 20_000, statisticsComments: 120, recordedComments: 58 },
        { at: 40_000, statisticsComments: 130, recordedComments: 60 }
      ],
      nowMs: 40_000,
      targetWindowMs: 60_000,
      minWindowMs: 15_000
    });
    expect(r).toEqual({
      previousStatisticsComments: 100,
      currentStatisticsComments: 130,
      receivedCommentsDelta: 10,
      statisticsCommentsDelta: 30,
      captureRatio: 1 / 3,
      sampleWindowMs: 40_000
    });
  });

  it('有効な 2 点が無ければ null', () => {
    expect(
      summarizeOfficialCommentHistory({
        history: [{ at: 0, statisticsComments: 100, recordedComments: 50 }],
        nowMs: 0
      })
    ).toBeNull();
  });

  it('記録値や統計値が欠けたサンプルは無視する', () => {
    const r = summarizeOfficialCommentHistory({
      history: [
        { at: 0, statisticsComments: 100, recordedComments: 50 },
        { at: 20_000, statisticsComments: null, recordedComments: 58 },
        { at: 40_000, statisticsComments: 130, recordedComments: 60 }
      ],
      nowMs: 40_000,
      targetWindowMs: 40_000,
      minWindowMs: 15_000
    });
    expect(r).toEqual({
      previousStatisticsComments: 100,
      currentStatisticsComments: 130,
      receivedCommentsDelta: 10,
      statisticsCommentsDelta: 30,
      captureRatio: 1 / 3,
      sampleWindowMs: 40_000
    });
  });
});
