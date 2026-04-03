# Codex / Claude などに投げる用の質問テンプレート（nicolivelog）

リポジトリを添付するか、`src/extension`・`src/lib`・`extension/manifest.json` のパスを明示して使ってください。

---

## 1. 文脈の説明（コピペ用）

```
Chrome MV3 拡張 nicolivelog です。
- 対象: https://live.nicovideo.jp/watch/lv... のコメント一覧を、ユーザーが「このPCで記録する」を ON にしたときだけ chrome.storage.local に蓄積する。
- 抽出: DOM の div.table-row[data-comment-type="normal"] と .comment-number / .comment-text（src/lib/nicoliveDom.js）。
- 仮想スクロール対策: コメントパネル内を縦スクロールしながら複数回抽出（src/lib/commentHarvest.js）。MutationObserver で追加ノードも拾う（src/extension/content-entry.js）。
- ポップアップ: 記録トグル・件数・ユーザー別集計・JSON ダウンロード。アクティブタブが watch でなくても、最後に開いた watch URL（nls_last_watch_url）で件数表示する。
- E2E: Playwright でローカルモック http://127.0.0.1:3456/watch/lv888888888/（tests/e2e）。
制約: DOM に載らないコメントは取れない。投稿者IDが DOM に無いとユーザー別は「ID未取得」にまとまる。
```

---

## 2. レビュー依頼

- **セキュリティ・権限**: `manifest.json` の `permissions` / `host_permissions` は最小限か。不要な権限はないか。
- **パフォーマンス**: `MutationObserver` が `documentElement` 全体を見ている。ニコ生の重いページで負荷やメモリの問題は起きうるか。改善案は。
- **ストレージ**: `chrome.storage.local` のクォータ（通常数 MB）を超えたときのユーザー向け挙動（切り詰め・警告・エクスポート促し）をどう設計するか。
- **SPA 遷移**: 同一タブで別 lv に切り替わったとき、`liveId` ポーリングと `pendingRoots` の扱いに穴はないか（content-entry.js）。

---

## 3. 機能拡張のアイデア依頼

- 投稿者ユーザーIDを DOM 以外から安定取得する方法（公式 API の有無、利用規約上の注意、技術的難易度）。**実装は規約遵守の範囲で**という前提で整理してほしい。
- タイムシフト・アーカイブ視聴ページでも同じ DOM 構造が使われるか。違う場合のセレクタ分岐の考え方。
- 「放送開始から完全なコメントログ」をブラウザ拡張だけで実現する限界と、現実的な代替（手動エクスポート、サーバ連携など）。

---

## 4. デバッグ依頼（症状を自分で書き換え）

```
症状: （例）記録 ON なのに保存件数が増えない / しおりが全部 ID未取得 / 深掘りスクロール後に一覧が元に戻らない など
環境: Chrome 版番号、拡張の読み込み方法（未パック）、該当の lv URL（伏せる場合はダミーでよい）
やったこと: npm run build、拡張再読み込み、別拡張の有無
```

求める出力: 疑うファイル名、確認すべき DevTools の見方、修正案のパッチ案。

---

## 5. テスト依頼

- `src/lib/*.test.js` と `tests/e2e/extension-recording.spec.js` で足りないケース（エッジケースのコメント本文、system メッセージ、空番号など）。
- CI（.github/workflows/ci.yml）に追加するとよいジョブ（lint、型チェック、E2E をどう headless で回すか）。

---

## 6. 利用規約・コンプライアンス（一般論）

- ニコニコ生放送の利用規約・ガイドライン上、視聴者がコメントをローカルに記録する行為について、**一般論として**注意すべき点のチェックリスト（法的助言ではなく、自己責任で確認すべき項目の列挙）。

---

このファイルはプロジェクト内の要約用です。外部 LLM には、必要なセクションだけコピーして送って構いません。
