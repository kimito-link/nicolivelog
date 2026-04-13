import { describe, expect, it } from 'vitest';
import { mergeNdgrBacklogWithCap, shouldDeferNdgrFlushUntilLiveId } from './ndgrBacklog.js';

describe('shouldDeferNdgrFlushUntilLiveId', () => {
  it('recording中・location許可・liveId未確定なら defer する', () => {
    expect(
      shouldDeferNdgrFlushUntilLiveId({
        recording: true,
        locationAllows: true,
        liveId: ''
      })
    ).toBe(true);
  });

  it('liveIdがあるなら defer しない', () => {
    expect(
      shouldDeferNdgrFlushUntilLiveId({
        recording: true,
        locationAllows: true,
        liveId: 'lv123'
      })
    ).toBe(false);
  });

  it('recording off / location不可なら defer しない', () => {
    expect(
      shouldDeferNdgrFlushUntilLiveId({
        recording: false,
        locationAllows: true,
        liveId: ''
      })
    ).toBe(false);
    expect(
      shouldDeferNdgrFlushUntilLiveId({
        recording: true,
        locationAllows: false,
        liveId: ''
      })
    ).toBe(false);
  });
});

describe('mergeNdgrBacklogWithCap', () => {
  it('既存 backlog の前に incoming を連結して保持する', () => {
    const existing = [{ commentNo: '2' }, { commentNo: '3' }];
    const incoming = [{ commentNo: '1' }];
    const out = mergeNdgrBacklogWithCap(existing, incoming, 10);
    expect(out.map((x) => x.commentNo)).toEqual(['1', '2', '3']);
  });

  it('cap を超えたら古い末尾を切り捨てる', () => {
    const existing = [{ commentNo: '2' }, { commentNo: '3' }, { commentNo: '4' }];
    const incoming = [{ commentNo: '1' }];
    const out = mergeNdgrBacklogWithCap(existing, incoming, 3);
    expect(out.map((x) => x.commentNo)).toEqual(['1', '2', '3']);
  });
});
