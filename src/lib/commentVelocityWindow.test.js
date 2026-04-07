import { describe, expect, it } from 'vitest';
import {
  commentsPerMinuteFromWindow,
  countCommentsInWindowMs
} from './commentVelocityWindow.js';

describe('commentVelocityWindow', () => {
  it('countCommentsInWindowMs は窓内のみ数える', () => {
    const now = 1_000_000;
    const entries = [
      { capturedAt: now - 30_000 },
      { capturedAt: now - 90_000 },
      { capturedAt: now }
    ];
    expect(countCommentsInWindowMs(entries, now, 60_000)).toBe(2);
  });

  it('commentsPerMinuteFromWindow は線形換算する', () => {
    expect(commentsPerMinuteFromWindow(10, 60_000)).toBe(10);
    expect(commentsPerMinuteFromWindow(5, 30_000)).toBe(10);
  });
});
