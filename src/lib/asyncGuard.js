/**
 * 星野ロミ useEncounters.ts パターン: 非同期関数の二重実行防止ガード。
 * if (isLoading) return; setLoading(true); try { ... } finally { setLoading(false); }
 * を汎用化。
 *
 * @param {(...args: any[]) => Promise<any>} fn
 * @param {{ skipValue?: any, onSkip?: (...args: any[]) => void }} [opts]
 */
export function createAsyncGuard(fn, opts) {
  let running = false;

  /**
   * @param {...any} args
   * @returns {Promise<any>}
   */
  async function guarded(...args) {
    if (running) {
      opts?.onSkip?.(...args);
      return opts?.skipValue;
    }
    running = true;
    try {
      return await fn(...args);
    } finally {
      running = false;
    }
  }

  guarded.isRunning = () => running;
  return guarded;
}
