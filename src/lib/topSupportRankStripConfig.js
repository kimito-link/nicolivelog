/**
 * ポップアップ「応援ランキング」ストリップに並べる行数の上限（aggregateCommentsByUser の1行＝1カード）。
 * 先頭に ID未取得の集計行が入ることがあるため、10 位まで出すには 11 が必要。
 * UI は横スクロールで吸収する想定。変更時は popup の表示幅・パフォーマンスを確認すること。
 */
export const TOP_SUPPORT_RANK_STRIP_MAX = 11;
