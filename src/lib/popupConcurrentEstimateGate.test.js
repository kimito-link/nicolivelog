import { describe, expect, it } from 'vitest';
import {
  concurrentEstimateIsSparseSignal,
  shouldShowConcurrentEstimate
} from './popupConcurrentEstimateGate.js';

describe('shouldShowConcurrentEstimate', () => {
  it('active commenters', () => {
    expect(
      shouldShowConcurrentEstimate({
        recentActiveUsers: 1,
        officialViewerCount: null,
        viewerCountFromDom: null,
        liveId: ''
      })
    ).toBe(true);
  });

  it('official viewers', () => {
    expect(
      shouldShowConcurrentEstimate({
        recentActiveUsers: 0,
        officialViewerCount: 42,
        viewerCountFromDom: null,
        liveId: ''
      })
    ).toBe(true);
  });

  it('DOM visitors including zero', () => {
    expect(
      shouldShowConcurrentEstimate({
        recentActiveUsers: 0,
        officialViewerCount: null,
        viewerCountFromDom: 0,
        liveId: ''
      })
    ).toBe(true);
    expect(
      shouldShowConcurrentEstimate({
        recentActiveUsers: 0,
        officialViewerCount: null,
        viewerCountFromDom: 1200,
        liveId: ''
      })
    ).toBe(true);
  });

  it('liveId fallback when no metrics', () => {
    expect(
      shouldShowConcurrentEstimate({
        recentActiveUsers: 0,
        officialViewerCount: null,
        viewerCountFromDom: null,
        liveId: 'lv123'
      })
    ).toBe(true);
    expect(
      shouldShowConcurrentEstimate({
        recentActiveUsers: 0,
        officialViewerCount: null,
        viewerCountFromDom: null,
        liveId: '  '
      })
    ).toBe(false);
  });

  it('DOM 来場者のみ（liveId 空でも）推定カードを出す', () => {
    expect(
      shouldShowConcurrentEstimate({
        recentActiveUsers: 0,
        officialViewerCount: undefined,
        viewerCountFromDom: 1,
        liveId: ''
      })
    ).toBe(true);
  });

  it('指標も liveId も無いときは推定カードを出さない（スピナー継続）', () => {
    expect(
      shouldShowConcurrentEstimate({
        recentActiveUsers: 0,
        officialViewerCount: null,
        viewerCountFromDom: null,
        liveId: ''
      })
    ).toBe(false);
  });

  it('公式 viewers が NaN のときはフォールバック扱いで出さない', () => {
    expect(
      shouldShowConcurrentEstimate({
        recentActiveUsers: 0,
        officialViewerCount: Number.NaN,
        viewerCountFromDom: null,
        liveId: ''
      })
    ).toBe(false);
  });
});

describe('concurrentEstimateIsSparseSignal', () => {
  it('no visitors or official or active is sparse', () => {
    expect(
      concurrentEstimateIsSparseSignal({
        recentActiveUsers: 0,
        officialViewerCount: null,
        viewerCountFromDom: null
      })
    ).toBe(true);
    expect(
      concurrentEstimateIsSparseSignal({
        recentActiveUsers: 0,
        officialViewerCount: null,
        viewerCountFromDom: 1
      })
    ).toBe(false);
  });

  it('DOM 来場者 0 でも「取得済み」とみなし sparse でない', () => {
    expect(
      concurrentEstimateIsSparseSignal({
        recentActiveUsers: 0,
        officialViewerCount: null,
        viewerCountFromDom: 0
      })
    ).toBe(false);
  });
});
