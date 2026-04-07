# コメントメタデータ（userId / avatarUrl）パイプライン整理メモ

最終更新: 2026-04-06  
外部 LLM（Claude / Gemini / Grok / Venis AI）および Cursor 上の調査を踏まえ、**nicolivelog 実装と整合する範囲**で要約した内部メモ。規約遵守・PII 最小化を前提とする。

---

## 1. レイヤ別：取得できること / 原理的限界 / フィールド例

### (1) DOM 抽出（content script + MutationObserver）

| 取りやすい例 | commentNo、userId（`data-user-id` や行内リンク・fiber 等）、nickname（表示テキスト）、**既にレンダリング済み**の `<img src="https://...">`。視聴 UI によっては **vpos・日時**も DOM に出るが、**現行の保存スキーマに載せているとは限らない**（要確認） |
| 取りにくい | 画面外・仮想スクロールで DOM に無い行、**lazy 未発火**の `img`（空 src / placeholder）、なふだ OFF 時の匿名ユーザー詳細 |
| 限界 | 表示依存（スクロール・フィルタで消える）、配信 UI 改修でセレクタは要メンテ |

**実装**: `src/lib/nicoliveDom.js`（`table-row` + `.comment-number` / `.comment-text`、種別は番号・本文が取れれば記録対象に含める）、`src/extension/content-entry.js`（MutationObserver、`closestHarvestableNicoCommentRow`）、`src/lib/commentHarvest.js`（仮想リスト深掘り）。

### (2) page script / intercept（fetch・XHR・NDGR 等）

| 取りやすい例 | commentNo、uid/userId、（経路によって）nickname。NDGR デコード結果は **本文・番号・user_id / hashed_user_id** 中心。fetch/XHR で捕捉できれば **別レスポンスに avatar が載る**こともある（コメント本体とは別 endpoint） |
| 取りにくい | **視聴者向けコメントストリーム単体**に avatar が無い／省略される場合が多い（帯域・設計）。「API レスポンス全体に常に avatarUrl が付く」とは**限らない**（過剰一般化に注意）。匿名 ID の公式サムネ URL **再構成不可** |
| 限界 | MV3 では background の `webRequest` で本文傍受しにくく、**MAIN world 注入 + postMessage** が現実解。配信形態（通常生 / チャンネル / タイムシフト）で構造差。**Service Worker だけで通信を包括的に読む**のは MV3 では現実的でない部分が多い |

**実装**: `src/extension/page-intercept-entry.js`、`src/lib/ndgrDecode.js`、`src/lib/ndgrChatRows.js`（UID 無し行も `userId: null` でマージ対象に含める変更済み）。

**外部説明との一致**: NDGR はコメント専用パイプとプロフィールが分離されており、**ストリーム内に avatar が無いのは正常**という見方と整合する。

### (3) chrome.storage 前後の enrich

| 取りやすい例 | (1)(2) のマージ結果に加え、**数値 userId** から公式 CDN の usericon URL を式で組み立て（追加リクエストなし） |
| 取りにくい | ストレージ書き込み時点ではまだネット上に現れていない av、サーバ非公開の画像。**enrich から user.info 等を大量に能動取得**する案はレート・規約上のリスクが高い（**ユーザー操作やページが既に取った応答のパッシブ利用**が無難） |
| 限界 | `storage.local` 容量、PII・同意範囲の説明 |

**実装**: `src/extension/content-entry.js` の `enrichRowsWithInterceptedUserIds`、`src/lib/supportGrowthTileSrc.js` の `niconicoDefaultUserIconUrl` / `resolveSupportGrowthTileSrc`。

### (4) popup + tabs messaging + マージ

| 取りやすい例 | `chrome.storage` の全件 + `tabs.sendMessage` で取得する intercept キャッシュを `commentNo` でマージ |
| 取りにくい | ページリロードで消えた揮発キャッシュ、メッセージ失敗時 |
| 限界 | 永続は storage 依存。重い処理は popup だけに寄せない方がよい |

**実装**: `src/extension/popup-entry.js` の `mergeCommentsWithInterceptCache`、`requestInterceptCacheFromOpenTab`。

**manifest**: content / page-intercept とも `all_frames: true`（iframe 内 UI も対象にしやすい設定）。

---

## 2. 「intercept で uid はあるが av がほぼ無い」理由（観測ベース）

1. **プロトコル・JSON 上、視聴者向けコメントに av を載せない**設計（NDGR / 移行後の配信でも同趣旨の説明が多い）。  
2. **アイコンは別 CDN / 別リクエスト**で lazy に載る → intercept した瞬間には未発火。  
3. **匿名（`a:` 系・ハッシュ ID）**は公式サムネ URL を数式で復元できない（仕様）。  
4. 配信種別・フレーム差で、取り込む JSON / DOM が異なる。

**対応済み（コード）**: NDGR 行で userId が無くても保存、`niconicoDefaultUserIconUrl` で数値 ID を補完、DOM 側で `normal` 以外の番号付き行も抽出。

---

## 3. 改善の優先度（規約遵守・実装しやすさ重視）

合意しやすい順（Grok / 社内整理と一致）:

1. **高**: page world で **ユーザー icon / profile 系**のレスポンスをパッシブに捕捉し、`userId → avatarUrl` を既存の `interceptedAvatars` 等に流す（**ページが既に取った分だけ**）。  
2. **中**: content script で **`<img>` の `src` が後から http になった**タイミングを検知し、対応する `commentNo` の storage 行を **avatarUrl だけパッチ**。  
3. **低**: CDN URL の式の厳密化（例: 1 万未満 subdir）、404 / 未設定のネガティブキャッシュ、ストレージへの「default」明示など。

### 3.1 優先順の別案（Venis AI）

別ソースでは **① DOM 抽出改善 → ② intercept 網羅 → ③フォールバック強化 → ④デバッグ** とする提案もある。  
**即効性で av 率を上げる**なら **icon/profile 系 intercept（上記 1）**が効きやすい一方、**セレクタ安定化・img 後追い（上記 2）**を先にやるとリスクが小さい、というトレードオフ。**どちらから着手するかはチーム判断**でよい。

---

## 4. デバッグ・診断（本番影響を抑える）

- **既存**: ポップアップの折りたたみ「開発・テスト用 監視」、`collectWatchPageSnapshot` の `_debug` 要約（本文断片の多いフィールドは `pickDevMonitorDebugSubset` で除外）。  
- **案（未実装）**: `debugTrace` フラグ時のみ、コメントに `trace`（経路・present/absent・時刻、userId は先頭数文字 or ハッシュ）を付与し、本番書き込みでは除外。`chrome.storage.session` への短命リングバッファも候補。

**Venis AI 案のスキーマ例**（本番では書かない・PII は短縮のこと）:

```javascript
// 開発モード専用のイメージ（保存時はフラグ OFF で省略）
{
  debugTrace: {
    commentNo: '12345',
    userIdPrefix: '86255…', // 先頭のみ or ハッシュ
    userIdSource: 'dom|intercept|api',
    avatarPresent: true,
    avatarUrlSource: 'dom|intercept|cdn_guess|fallback',
    ts: 1712345678901,
    processingPath: 'extract->enrich->merge'
  }
}
```

**フック候補**: DOM 抽出直後、page script の JSON 処理、`mergeCommentsWithInterceptCache` 前後、`storage.local.set` 直前。  
**保存場所**: 拡張コンテキストでは **`window.localStorage` より `chrome.storage.session`** の方が用途に合いやすい（セッション寿命・SW との整合）。

---

## 5. 匿名 ID と数字 IDの扱い

- **匿名（`a:` 等 / ハッシュ）**: 公式サムネ URL は再構成しない。診断上は「仕様で N/A」と区別。UI は既定アイコン／null。  
- **数字 ID**: CDN 式で補完。404・未設定は表示側でプレースホルダに落とす既存パターンあり。ストレージに「default」と明示するかは別判断。

---

## 6. OSINT シグナル台帳（テスト観点の索引）

ページが**既に公開している**DOM / クライアント通信から取れるシグナルと実装入口。**ユーザーアバター**と**番組サムネ（動画キャプチャ）**は別経路なので混同しない。

| シグナル | 想定ソース | 既存実装の入口 |
|----------|------------|----------------|
| commentNo + text | DOM / NDGR | `parseNicoLiveTableRow`, `ndgrChatRows` |
| 数字 userId | DOM attr / fiber / icon URL / intercept | `resolveUserIdForNicoLiveCommentRow`, intercept maps |
| 匿名 ID | DOM / NDGR hashed | 公式サムネ URL は再構成せず UI フォールバック |
| avatar http(s) | img src / data-* / bg / intercept | `extractUserIconUrlFromElement`, `mergeNewComments` |
| CDN 推定 usericon | 数字 userId のみ（式） | `niconicoDefaultUserIconUrl` |
| 番組サムネキャプチャ | video + IndexedDB | `runThumbCaptureTick` 等（ユーザー av とは分離） |

---

## 7. 関連コード一覧（調査の起点）

| 領域 | パス |
|------|------|
| DOM 抽出 | `src/lib/nicoliveDom.js` |
| 仮想スクロール収穫 | `src/lib/commentHarvest.js` |
| content 記録・enrich | `src/extension/content-entry.js` |
| NDGR / intercept | `src/extension/page-intercept-entry.js`, `src/lib/ndgrChatRows.js` |
| intercept JSON 走査（純関数） | `src/lib/niconicoInterceptLearn.js` |
| CDN 補完 | `src/lib/supportGrowthTileSrc.js` |
| 監視パネル av 集計 | `src/lib/devMonitorAvatarStats.js` |
| popup マージ | `src/extension/popup-entry.js`（`mergeCommentsWithInterceptCache`） |
| 開発者向け監視 UI | `extension/popup.html`, `renderDevMonitorPanel` in `popup-entry.js` |
| デバッグ JSON サブセット | `src/lib/devMonitorDebugSubset.js` |

---

## 8. 外部プロンプト・ドキュメントとの同期

- `docs/llm-handoff-questions.md` の「`normal` のみ抽出」など、**古い記述は DOM 実装と矛盾**し得る。プロンプトに貼る際は本メモの **(1) DOM** 節を正とする。  
- Claude 寄りの NDGR 分離説明、Gemini / Grok の多レイヤ補完は、**上記 1〜3 章と同趣旨**として読み替えてよい。  
- **Venis AI**: 原因列挙・デバッグ構造・匿名/数字のフォールバック方針は有用。**「intercept で常に avatarUrl が取れる」前提**や **Service Worker 包括傍受**は本リポジトリの前提（page world + NDGR）とずれるので、**§1(2)・§3 の注記を優先**すること。

---

## 9. NDGR `account_status`（継続調査）

**目的**: コメント行の「プレミアム会員か」等の比率集計に使う前に、**プロトコル上の意味と実測表示の対応**を固定する。

| 状態 | 実装・メモ |
|------|------------|
| 保存 | `src/lib/ndgrDecode.js` の `decodeChat` が modifier 由来の数値を `accountStatus` として `commentRecord.js` の行に載せる（未取得は `undefined`）。 |
| 意味付け | **公式 proto / 実機ログの突き合わせが未完了**。ニコ生 UI のバッジ（プレミアム等）と 1 対 1 で対応すると決め打ちしないこと。 |
| 追従タスク | `SimpleNotificationV2` 等のフィールド追加・リネームがあれば `ndgrDecode` / `ndgrChatRows` を更新し、本節の対応表を更新する。 |
| 分析利用 | ダッシュボードの「プレミアム比率」等は、**対応表が確定するまで集計対象に含めないか、ラベルに「未検証」と明記**する。 |
