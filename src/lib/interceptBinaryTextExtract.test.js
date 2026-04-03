import { describe, expect, it } from 'vitest';
import { extractPairsFromBinaryUtf8 } from './interceptBinaryTextExtract.js';

describe('extractPairsFromBinaryUtf8', () => {
  it('returns empty array for empty or non-matching text', () => {
    expect(extractPairsFromBinaryUtf8('')).toEqual([]);
    expect(extractPairsFromBinaryUtf8('hello')).toEqual([]);
  });

  it('pairs nearby no and userId', () => {
    const text = '{"no":1205,"userId":"12345678","content":"hi"}';
    const pairs = extractPairsFromBinaryUtf8(text);
    expect(pairs).toContainEqual({ no: '1205', uid: '12345678' });
  });

  it('pairs raw_user_id with comment_no', () => {
    const text = '{"comment_no":99,"raw_user_id":"987654321","x":1}';
    const pairs = extractPairsFromBinaryUtf8(text);
    expect(pairs).toContainEqual({ no: '99', uid: '987654321' });
  });

  it('pairs hashed_user_id', () => {
    const text = `"no": 42, "hashed_user_id": "sy5SJPxX5uj_hLNJgBtIMDxr9hw"`;
    const pairs = extractPairsFromBinaryUtf8(text);
    expect(pairs.some((p) => p.no === '42' && p.uid.startsWith('sy5S'))).toBe(true);
  });

  it('does not pair when no and uid are too far apart', () => {
    const a = 'x'.repeat(700);
    const text = `{"no":1${a}"userId":"12345678"}`;
    expect(extractPairsFromBinaryUtf8(text)).toEqual([]);
  });
});
