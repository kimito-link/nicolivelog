import { describe, expect, it } from 'vitest';
import { peakConcurrentEstimateFromSnapshot } from './broadcastSessionSummaryFlush.js';

describe('broadcastSessionSummaryFlush', () => {
  it('peakConcurrentEstimateFromSnapshot はスナップショットが無ければ null', () => {
    expect(peakConcurrentEstimateFromSnapshot(null)).toBeNull();
    expect(peakConcurrentEstimateFromSnapshot(undefined)).toBeNull();
  });
});
