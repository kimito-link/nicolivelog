/**
 * 星野ロミ geocoding.ts パターン: 最小間隔を守るリクエストスロットル。
 * 連続呼び出しをキューに入れ、前回から minIntervalMs 経過後に実行。
 *
 * @param {(...args: any[]) => Promise<any>} fn
 * @param {{ minIntervalMs?: number }} [opts]
 */
export function createRequestThrottle(fn, opts) {
  const minMs = Number(opts?.minIntervalMs) || 0;
  let lastCallTime = 0;
  /** @type {Array<{ args: unknown[], resolve: (v: any) => void, reject: (e: any) => void }>} */
  const queue = [];
  let draining = false;

  async function drain() {
    if (draining) return;
    draining = true;
    try {
      while (queue.length) {
        const now = Date.now();
        const wait = Math.max(0, minMs - (now - lastCallTime));
        if (wait > 0) {
          await new Promise((r) => setTimeout(r, wait));
        }
        const item = queue.shift();
        if (!item) break;
        lastCallTime = Date.now();
        try {
          const result = await fn(...item.args);
          item.resolve(result);
        } catch (e) {
          item.reject(e);
        }
      }
    } finally {
      draining = false;
    }
  }

  /**
   * @param {...any} args
   * @returns {Promise<any>}
   */
  function throttled(...args) {
    if (!lastCallTime || Date.now() - lastCallTime >= minMs) {
      lastCallTime = Date.now();
      return fn(...args);
    }
    return new Promise((resolve, reject) => {
      queue.push({ args, resolve, reject });
      drain();
    });
  }

  throttled.pending = () => queue.length;
  return throttled;
}
