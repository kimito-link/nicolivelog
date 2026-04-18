# UX 仮説行列（テスト駆動 × リサーチトレース）

Quen 文書の観点を検証可能な仮説 ID に落とし、Playwright / 手動の合格基準と一次ソースメモを対応付ける。長文ポリシー回避のため最小限のみ記載する。

## 仮説一覧

| ID | 内容（要約） | 検証手段 | Spec / 場所 | 合格基準（例） |
|----|-------------|----------|----------------|----------------|
| H1-Retired | （撤回）開いた瞬間に記録 ON/OFF を視覚で見せる方針は撤回。記録は基本 ON 固定運用とし、トグルは詳細設定の中へ移動 | — | — | — |
| H1-MachineReadable | 記録 ON/OFF の機械可読状態は `<html data-nl-recording>` で公開する（CSS/E2E 用フック。表示状態の単一ソースは `#recordToggle.checked`） | Playwright | `tests/e2e/popup-recording-sa.spec.js` | `data-nl-recording` が `on`/`off` で `checked` と一致 |
| H1-a11y | 「説明ゼロ」と支援技術の両立（詳細設定を開けば見える） | Playwright + 手動 | 同上 + `popup.html` | `aria-label`（または等価の名前）が記録トグルに残る |
| H2-Consistency | ポップアップと `inline=1` で記録表示が同じストレージを反映 | Playwright | `tests/e2e/popup-recording-sa.spec.js` | 同一 `chrome.storage.local` 値に対し両方で `data-nl-recording` が一致 |
| H3-Progressive | 詳細設定は折りたたみ内（既存）。記録トグルもこの中に同居（H1 撤回の帰結） | Playwright | `tests/e2e/popup-settings-details.spec.js` | `details#nlPopupSettings` 初期 `open === false`。展開後に `#recordToggle` が見える |
| H4-FirstViewToComment | ファーストビューはコメント入力を最短化する（記録系の説明・トグルで占有しない） | 手動 + 視覚回帰 | `popup.html` ヒーロー部 | ファーストビューに記録トグルや記録説明テキストが出ない |

## リサーチトレース（仮説 ID 別）

### H1-Retired（旧 H1-Perception の撤回理由）

- **発端**: 「基本は常に ON にしておけばいいので、これ自体はいらない気がします」というユーザーフィードバック。記録トグルの常時露出はファーストビューの限られた縦領域を奪い、コメント入力までの動線を遠くしていた。
- **判断**: 記録 ON/OFF の状態をファーストビューで見せる責務（旧 H1-Perception）は撤回。記録は基本 ON で運用し、停止が必要な場合のみ詳細設定（`<details id="nlPopupSettings">`）を開いて切り替える。
- **ファーストビューの新責務**: コメント入力の最短化（H4-FirstViewToComment）。記録トグル・記録説明・記録ヒーローカードはここから完全撤去する。
- **機械可読状態は維持**: ユーザーには見せないが、CSS / E2E 用に `<html data-nl-recording>` は同期し続ける（H1-MachineReadable）。これにより将来「OFF 時だけパネルに静かな印を出す」等の派生を低コストで実装できる。

### H1-MachineReadable / H1-a11y

- **WCAG 2.2 4.1.2 名前・役割・値**: コントロールの状態がプログラム的に解釈できること。チェックボックスの `checked` に加え、テスト安定化用に `data-nl-recording` を併用（表示状態の単一ソースは仍ち `checked`）。
- **MDN `<input type="checkbox">`**: ネイティブの `checked` IDL 属性が支援技術に伝わる。独自 `role="switch"` への置換は必須ではない。
- **採用判断**: 既存の `aria-label` を維持しつつ、E2E と将来のスタイル用に `data-nl-recording` を `<html>` ルートに付与（記録トグルが詳細設定内に移ったため、ヒーロー要素ではなくドキュメントルートに付ける）。色のみに依存しない（色覚・暗所視聴）。

### H4-FirstViewToComment

- **発端**: 「C がいいような気がするのと、そうするとすぐにコメントが打てそうなので良い気がします」。記録トグルを詳細設定内へ移動した直接の動機。
- **採用判断**: ファーストビューの責務はコメント入力の最短化に絞る。記録系の UI 要素（説明文・トグル・状態バッジ）はファーストビューに置かない。
- **回帰検出**: 自動 E2E は仕様未確定のため手動。視覚回帰として、ポップアップ初期表示のスクリーンショットに記録トグル / 記録説明が映らないことを目視確認する。

### H2-Consistency

- **Chrome Extension**: `popup.html` と `popup.html?inline=1` は同一ドキュメントのため、同一 `refresh()` 経路でハイドレートすれば理論上一致。検証はストレージ書き換え後の再読込で行う。
- **採用判断**: 二画面の分岐ロジックを増やさず、`refresh()` 内の単一関数で `data-nl-recording` を同期。

### H3-Progressive

- 既存実装・spec で担保済み。本行列では追跡のみ。

## 次サイクル（未着手の論点メモ）

- 周辺視野・1 秒グランサビリティ: 手動プロトコル（デュアルタスク）向け。自動 E2E 化は別タスク。
- Twitch Extension ガイドライン（点滅禁止等）: インラインオーバーレイ改修時に `H4-Motion` として追加推奨。
