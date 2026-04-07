import { describe, it, expect } from 'vitest';
import { TOP_SUPPORT_RANK_STRIP_MAX } from './topSupportRankStripConfig.js';

describe('topSupportRankStripConfig', () => {
  it('ストリップ表示の上限は11（未取得集計＋10位まで）', () => {
    expect(TOP_SUPPORT_RANK_STRIP_MAX).toBe(11);
  });
});
