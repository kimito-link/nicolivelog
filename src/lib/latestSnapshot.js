/**
 * 星野ロミ backgroundLocation.ts パターン: バーストデータから最新だけ処理。
 * 高頻度で到着するデータ（コメント/スナップショット）をデバウンスし、
 * 最新の1件だけ processFn に渡す。中間値は破棄。
 *
 * @template T
 * @param {(latest: T) => void} processFn
 * @param {{ debounceMs?: number }} [opts]
 */
export function createLatestSnapshot(processFn, opts) {
  const debounceMs = Number(opts?.debounceMs) || 100;
  /** @type {T|undefined} */
  let current;
  /** @type {ReturnType<typeof setTimeout>|null} */
  let timer = null;

  /** @param {T} value */
  function push(value) {
    current = value;
    if (timer !== null) clearTimeout(timer);
    timer = setTimeout(() => {
      timer = null;
      if (current !== undefined) processFn(current);
    }, debounceMs);
  }

  function cancel() {
    if (timer !== null) {
      clearTimeout(timer);
      timer = null;
    }
  }

  function latest() {
    return current;
  }

  return { push, cancel, latest };
}
