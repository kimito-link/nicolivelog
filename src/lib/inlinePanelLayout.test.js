import { describe, expect, it } from 'vitest';
import {
  computeInlinePanelSizeAndOffset,
  isValidBroadcastPlayerRect,
  selectBestPlayerRectIndex
} from './inlinePanelLayout.js';

const VP = { innerWidth: 1280, innerHeight: 720 };

describe('isValidBroadcastPlayerRect', () => {
  it('16:9 の十分な大きさなら true', () => {
    expect(
      isValidBroadcastPlayerRect(
        { width: 960, height: 540, top: 100, left: 40 },
        VP
      )
    ).toBe(true);
  });

  it('小さすぎると false', () => {
    expect(
      isValidBroadcastPlayerRect(
        { width: 200, height: 150, top: 100, left: 40 },
        VP
      )
    ).toBe(false);
  });

  it('極端なアスペクトは false', () => {
    expect(
      isValidBroadcastPlayerRect(
        { width: 800, height: 100, top: 100, left: 40 },
        VP
      )
    ).toBe(false);
  });

  it('画面下端外は false', () => {
    expect(
      isValidBroadcastPlayerRect(
        { width: 640, height: 360, top: 700, left: 40 },
        VP
      )
    ).toBe(false);
  });
});

describe('selectBestPlayerRectIndex', () => {
  it('有効な矩形のうち面積最大のインデックスを返す', () => {
    const rects = [
      { width: 320, height: 180, top: 10, left: 10 },
      { width: 960, height: 540, top: 10, left: 10 },
      { width: 100, height: 100, top: 10, left: 10 }
    ];
    expect(selectBestPlayerRectIndex(rects, VP)).toBe(1);
  });

  it('有効なものがなければ -1', () => {
    expect(
      selectBestPlayerRectIndex(
        [{ width: 50, height: 50, top: 0, left: 0 }],
        VP
      )
    ).toBe(-1);
  });
});

describe('computeInlinePanelSizeAndOffset', () => {
  it('親と同幅の video は margin 0・幅は video に合わせる', () => {
    const video = { width: 800, height: 450, top: 0, left: 100 };
    const parent = { width: 800, height: 500, top: 0, left: 100 };
    expect(
      computeInlinePanelSizeAndOffset(video, parent, VP)
    ).toEqual({ panelWidthPx: 800, marginLeftPx: 0 });
  });

  it('親より左に寄った video は marginLeft がずれ分になる', () => {
    const video = { width: 640, height: 360, top: 0, left: 180 };
    const parent = { width: 960, height: 400, top: 0, left: 100 };
    expect(
      computeInlinePanelSizeAndOffset(video, parent, VP)
    ).toEqual({ panelWidthPx: 640, marginLeftPx: 80 });
  });

  it('右端ギリギリでも最小幅は維持（残り幅が狭くても minWidth は下回らない）', () => {
    const video = { width: 900, height: 500, top: 0, left: 1200 };
    const narrow = { innerWidth: 1280, innerHeight: 720 };
    const r = computeInlinePanelSizeAndOffset(
      video,
      { width: 1200, height: 600, top: 0, left: 80 },
      narrow
    );
    expect(r.marginLeftPx).toBe(1120);
    expect(r.panelWidthPx).toBe(320);
  });

  it('parent が null でも幅は計算できる（margin 0）', () => {
    const r = computeInlinePanelSizeAndOffset(
      { width: 640, height: 360, top: 0, left: 20 },
      null,
      VP
    );
    expect(r.marginLeftPx).toBe(0);
    expect(r.panelWidthPx).toBe(640);
  });
});
