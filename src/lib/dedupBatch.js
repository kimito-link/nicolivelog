/**
 * 星野ロミ matcher.ts パターン: Set/Map による重複排除とバッチ集約。
 */

/**
 * キー関数で重複を排除しながらアイテムを蓄積する。
 * flush() で蓄積分を一括取得してクリア。
 *
 * @template T
 * @param {(item: T) => string} keyFn
 * @param {{ maxSize?: number }} [opts]
 */
export function createDedupAccumulator(keyFn, opts) {
  const maxSize = Number(opts?.maxSize) || 0;
  /** @type {Map<string, T>} */
  const map = new Map();

  /**
   * @param {T} item
   * @returns {boolean} 追加された場合 true
   */
  function add(item) {
    const key = keyFn(item);
    if (map.has(key)) return false;
    map.set(key, item);
    if (maxSize > 0 && map.size > maxSize) {
      const oldest = map.keys().next().value;
      if (oldest !== undefined) map.delete(oldest);
    }
    return true;
  }

  /** @param {string} key */
  function has(key) {
    return map.has(key);
  }

  /** @returns {T[]} */
  function flush() {
    const items = [...map.values()];
    map.clear();
    return items;
  }

  function size() {
    return map.size;
  }

  return { add, has, flush, size };
}

/**
 * アイテム配列をキーごとに Map<key, items[]> に集約する。
 * 通知のバッチ化（ユーザー単位でまとめる等）に使用。
 *
 * @template T
 * @param {T[]} items
 * @param {(item: T) => string} keyFn
 * @returns {Map<string, T[]>}
 */
export function batchAggregateByKey(items, keyFn) {
  /** @type {Map<string, T[]>} */
  const result = new Map();
  for (const item of items) {
    const key = keyFn(item);
    if (!key) continue;
    const arr = result.get(key);
    if (arr) {
      arr.push(item);
    } else {
      result.set(key, [item]);
    }
  }
  return result;
}
