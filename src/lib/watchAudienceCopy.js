/**
 * watch パネル「観客メモ」用の短文・ツールチップ文言（DOM 非依存）。
 * _debug は本文・title のいずれにも含めない。
 */

const BODY_TEXT =
  '来場者数は、配信ページに出ている累計（公式のカウント）です。NicoDB（https://nicodb.net/）とも比較しやすい定義です。推定同時接続はコメントなどからこの拡張が出している目安で、公式の同接表示ではありません。HTMLレポートの「来場（応援コメント）」は別の意味です。数字の更新は数十秒おき程度です。';

const TITLE_TEXT =
  '累計来場者はページの公式データから、推定同時接続は記録したコメントなどから計算しています。詳しい式はLPの「推定同時接続」節を参照してください。';

/**
 * @param {{ snapshot: Record<string, unknown>|null|undefined }} params
 * @returns {{ body: string, title: string }}
 */
export function buildWatchAudienceNote({ snapshot }) {
  void snapshot;
  return {
    body: BODY_TEXT,
    title: TITLE_TEXT
  };
}
