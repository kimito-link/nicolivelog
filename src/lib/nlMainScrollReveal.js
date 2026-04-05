/**
 * `.nl-main` のようなスクロール親の getBoundingClientRect と子要素の rect から、
 * scrollTop に加算する delta を求める（popup-entry の挙動と一致させる）。
 *
 * @param {{ top: number, bottom: number }} parentRect
 * @param {{ top: number, bottom: number }} elRect
 * @param {number} [pad=12]
 * @returns {number}
 */
export function computeScrollDeltaToRevealInParent(parentRect, elRect, pad = 12) {
  const deltaTop = elRect.top - parentRect.top;
  const deltaBottom = elRect.bottom - parentRect.bottom;
  if (deltaTop < pad) {
    return deltaTop - pad;
  }
  if (deltaBottom > -pad) {
    return deltaBottom + pad;
  }
  return 0;
}
