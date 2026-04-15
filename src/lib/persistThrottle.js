/**
 * ストレージ書き込みのコアレシング（ロミさんの throttle パターン応用）。
 * 複数ソース（MutationObserver, NDGR, deepHarvest）からの行を
 * 最小間隔にまとめて1回の read-merge-write にする。
 *
 * burstThreshold を指定すると、バッファが閾値を超えた時点で最小間隔を待たず
 * 即時 flush する（誕生日・ファンミ等の高流量で体感レイテンシを短縮）。
 *
 * @param {(batch: unknown[]) => Promise<void>} flushFn
 * @param {number} [minIntervalMs]
 * @param {number} [burstThreshold] 0 以下は無効（既定の throttle 挙動）
 */
export function createPersistCoalescer(flushFn, minIntervalMs = 300, burstThreshold = 0) {
  /** @type {unknown[]} */
  let buffer = [];
  /** @type {ReturnType<typeof setTimeout>|null} */
  let timer = null;
  let lastFlushTime = 0;

  /** @param {unknown[]} rows */
  function enqueue(rows) {
    buffer.push(...rows);
    if (burstThreshold > 0 && buffer.length >= burstThreshold) {
      // バースト閾値到達: 即時 flush（既存の timer は flush() 内でクリア）
      void flush();
      return;
    }
    if (timer) return;
    const delay = lastFlushTime
      ? Math.max(0, minIntervalMs - (Date.now() - lastFlushTime))
      : 0;
    timer = setTimeout(flush, delay);
  }

  async function flush() {
    if (timer) { clearTimeout(timer); timer = null; }
    if (!buffer.length) return;
    const batch = buffer;
    buffer = [];
    lastFlushTime = Date.now();
    await flushFn(batch);
  }

  function clear() {
    buffer = [];
    if (timer) { clearTimeout(timer); timer = null; }
  }

  return { enqueue, flush, clear, pending: () => buffer.length };
}
