/**
 * 星野ロミ locations/route.ts パターン: 副次データ取得の失敗を吸収。
 * `.catch(() => null)` を型安全に汎用化。
 * メイン処理を止めずに「あれば使う」データの取得に使う。
 */

/**
 * 非同期関数を実行し、失敗時は null を返す。
 *
 * @template T
 * @param {(...args: unknown[]) => Promise<T>} fn
 * @param {...unknown} args
 * @returns {Promise<T|null>}
 */
export async function safeOptional(fn, ...args) {
  const last = args.length > 0 ? args[args.length - 1] : undefined;
  const opts = last && typeof last === 'object' && 'onError' in /** @type {object} */ (last)
    ? /** @type {{ onError?: (e: unknown) => void }} */ (args.pop())
    : null;
  try {
    return await fn(...args);
  } catch (e) {
    opts?.onError?.(e);
    return null;
  }
}

/**
 * 同期関数を実行し、例外時は null を返す。
 *
 * @template T
 * @param {() => T} fn
 * @returns {T|null}
 */
export function safeOptionalSync(fn) {
  try {
    return fn();
  } catch {
    return null;
  }
}

/**
 * 非同期関数を実行し、失敗時はフォールバック値を返す。
 * 星野ロミ geocoding.ts の `return "不明なエリア"` パターン。
 *
 * @template T, F
 * @param {() => Promise<T>} fn
 * @param {F | (() => F)} fallback
 * @returns {Promise<T|F>}
 */
export async function withFallback(fn, fallback) {
  try {
    return await fn();
  } catch {
    return typeof fallback === 'function' ? /** @type {() => F} */ (fallback)() : fallback;
  }
}
