import { describe, it, expect } from 'vitest';
import { computeScrollDeltaToRevealInParent } from './nlMainScrollReveal.js';

describe('computeScrollDeltaToRevealInParent', () => {
  const pad = 12;

  it('上下ともパディング内なら delta は 0', () => {
    const parent = { top: 100, bottom: 500 };
    const el = { top: 120, bottom: 400 };
    expect(computeScrollDeltaToRevealInParent(parent, el, pad)).toBe(0);
  });

  it('上端がパディング未満なら上にスクロール（delta 負）', () => {
    const parent = { top: 100, bottom: 500 };
    const el = { top: 105, bottom: 200 };
    expect(computeScrollDeltaToRevealInParent(parent, el, pad)).toBe(105 - 100 - pad);
  });

  it('要素が親の上に見切れている場合も上方向に補正', () => {
    const parent = { top: 100, bottom: 500 };
    const el = { top: 80, bottom: 150 };
    expect(computeScrollDeltaToRevealInParent(parent, el, pad)).toBe(80 - 100 - pad);
  });

  it('下端がパディングを食い込むなら下にスクロール（delta 正）', () => {
    const parent = { top: 100, bottom: 500 };
    const el = { top: 400, bottom: 510 };
    expect(computeScrollDeltaToRevealInParent(parent, el, pad)).toBe(510 - 500 + pad);
  });

  it('上優先: 上端も下端も外れているときは上端ルールが先', () => {
    const parent = { top: 100, bottom: 500 };
    const el = { top: 90, bottom: 520 };
    expect(computeScrollDeltaToRevealInParent(parent, el, pad)).toBe(90 - 100 - pad);
  });

  it('pad 省略時は 12', () => {
    const parent = { top: 0, bottom: 100 };
    const el = { top: 5, bottom: 50 };
    expect(computeScrollDeltaToRevealInParent(parent, el)).toBe(5 - 12);
  });

  it('ちょうど境界付近（上端ちょうど pad）', () => {
    const parent = { top: 100, bottom: 500 };
    const el = { top: 112, bottom: 200 };
    expect(computeScrollDeltaToRevealInParent(parent, el, pad)).toBe(0);
  });
});
