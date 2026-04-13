/**
 * Map のサイズを max 以下に制限し、先頭（最古挿入順）から削除する。
 * content-entry.js の activeUserTimestamps / interceptedUsers で3箇所重複していたパターンを統一。
 *
 * @template K, V
 * @param {Map<K, V>} map
 * @param {number} max
 */
export function trimMapToMax(map, max) {
  if (map.size <= max) return;
  const excess = map.size - max;
  const iter = map.keys();
  for (let i = 0; i < excess; i++) {
    const key = iter.next().value;
    if (key != null) map.delete(key);
  }
}
