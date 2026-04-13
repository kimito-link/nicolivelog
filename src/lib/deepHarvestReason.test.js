import { describe, expect, it } from 'vitest';
import { DEEP_HARVEST_REASONS, isKnownDeepHarvestReason } from './deepHarvestReason.js';

describe('DEEP_HARVEST_REASONS', () => {
  it('既知の reason 値を提供する', () => {
    expect(DEEP_HARVEST_REASONS.startup).toBe('startup');
    expect(DEEP_HARVEST_REASONS.recordingOn).toBe('recording-on');
    expect(DEEP_HARVEST_REASONS.liveIdChange).toBe('live-id-change');
    expect(DEEP_HARVEST_REASONS.tabVisible).toBe('tab-visible');
  });
});

describe('isKnownDeepHarvestReason', () => {
  it('既知の reason は true', () => {
    expect(isKnownDeepHarvestReason(DEEP_HARVEST_REASONS.startup)).toBe(true);
    expect(isKnownDeepHarvestReason(DEEP_HARVEST_REASONS.recordingOn)).toBe(true);
    expect(isKnownDeepHarvestReason(DEEP_HARVEST_REASONS.liveIdChange)).toBe(true);
    expect(isKnownDeepHarvestReason(DEEP_HARVEST_REASONS.tabVisible)).toBe(true);
  });

  it('未知の reason は false', () => {
    expect(isKnownDeepHarvestReason('unknown')).toBe(false);
    expect(isKnownDeepHarvestReason('')).toBe(false);
    expect(isKnownDeepHarvestReason(null)).toBe(false);
  });
});
