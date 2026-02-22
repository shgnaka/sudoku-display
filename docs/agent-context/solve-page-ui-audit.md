# Solve Page UI Audit

## 目的 / 対象読者（coding agent）
SolveページのUI改善を行う際に、現行実装の状態（対応済み/残課題）と優先度を共有するための背景資料。主対象は実装担当のコーディングエージェント。

## 調査日
2026-02-22

## 現状要約
- `SolvePage` はコンテナ役へ整理され、選択制御・表示構築・入力UIが分割済み。
- solve専用スタイルは `src/styles/solve-page.css` に分離され、`src/App.css` には全体/共通スタイルが主に残っている。
- 画面幅判定は `src/constants/layout.ts` の定数を参照する形へ一元化済み。
- sheet入力時の数字キーとBackspaceは同条件でdisabled化され、操作可能状態の一貫性が改善済み。

## 監査結果（優先度付き、ファイル:行番号付き）

### 対応済み（High）
1. Solveページの責務分離
- 状態: 対応済み
- 根拠: `src/pages/SolvePage.tsx:11`, `src/pages/SolvePage.tsx:44`, `src/pages/solve/useSolveSelectionController.ts:27`, `src/pages/solve/SolveBoardPanel.tsx:10`, `src/pages/solve/SolveControlsPanel.tsx:3`, `src/pages/solve/SolveInputSection.tsx:3`
- 補足: `SolvePage` は状態連携のコンテナ中心になり、選択制御や表示ロジックが分離された。

2. スタイル定義の混在
- 状態: 対応済み
- 根拠: `src/pages/SolvePage.tsx:3`, `src/styles/solve-page.css:1`, `src/App.css:35`, `src/App.css:118`
- 補足: solveページ専用スタイルは `solve-page.css` に移動済み。

3. ブレークポイント定義の分散
- 状態: 対応済み
- 根拠: `src/constants/layout.ts:1`, `src/lib/useIsMobileViewport.ts:2`, `src/lib/useSolveInputSheetViewport.ts:2`, `src/styles/solve-page.css:390`
- 補足: TS側は共有定数参照、CSS側には同期注意コメントを置いて運用している。

### 対応済み（Medium）
1. セル選択解除イベントの重複監視
- 状態: 対応済み
- 根拠: `src/pages/solve/useSolveSelectionController.ts:82`, `src/pages/solve/useSolveSelectionController.ts:96`
- 補足: 監視は `click` キャプチャ1本へ整理済み。

2. 数字入力UIの状態一貫性（Backspace）
- 状態: 対応済み
- 根拠: `src/components/SolveNumberPad.tsx:1`, `src/components/SolveNumberPad.tsx:33`, `src/pages/solve/SolveInputSection.tsx:26`, `src/pages/SolvePage.tsx:59`
- 補足: `inputDisabled` を数字キー/Backspaceの両方に適用。

#### 2-1. 事実確認（Backspace挙動・現行）
- Backspaceボタンには `disabled={backspaceDisabled}` が付与される。
  - 根拠: `src/components/SolveNumberPad.tsx:33`
- 親側は `backspaceDisabled={inputDisabled}` を渡し、`inputDisabled` は `isReviewMode || selectedCell === null`。
  - 根拠: `src/pages/solve/SolveInputSection.tsx:26`, `src/pages/SolvePage.tsx:59`
- 防御的に `handleNumberPadBackspace` は未選択/レビュー時に早期returnする。
  - 根拠: `src/pages/solve/useSolveSelectionController.ts:135`
- テストも「review時はBackspace disabled / 未選択時 disabled」を検証している。
  - 根拠: `src/components/__tests__/SudokuGrid.test.tsx:394`, `src/components/__tests__/SudokuGrid.test.tsx:414`
- 実行確認:
  - `npm run test -- --run src/components/__tests__/SudokuGrid.test.tsx -t "backspace|review mode|number keys"` を実行し、該当テストは通過。

#### 2-2. 状態別挙動マトリクス（現行）
| 入力モード | 状態 | 数字キー | Backspace | 結果 |
| --- | --- | --- | --- | --- |
| sheet | normal + selectedCellあり | 有効 | 有効 | 数字入力/消去とも機能する |
| sheet | normal + selectedCellなし | 無効 | 無効 | 入力不可 |
| sheet | review | 無効 | 無効 | 入力不可 |
| sheet | ink | 非表示 | 非表示 | number pad自体が非表示 |
| keyboard | 任意 | 非表示 | 非表示 | number pad自体が非表示 |

### 残課題（次フェーズ）
1. モバイル時の凡例非表示
- 問題: `solve-no-scroll` 時に凡例を完全に非表示にしている。
- 根拠: `src/styles/solve-page.css:357`
- 期待効果: 色の意味理解を維持しつつ、省スペース表示の改善案を検討できる。

2. セルラベルの読み上げ情報量
- 問題: `aria-label` が `r1c1` 形式で、意味が直感的ではない。
- 根拠: `src/components/SudokuCell.tsx:81`, `src/components/SudokuCell.tsx:97`
- 期待効果: スクリーンリーダー利用時の理解速度を改善できる。

## 非目標（今回やらないこと）
- 盤面ロジック（解答判定、生成アルゴリズム）の変更
- WASM連携仕様の変更
- 全ページのデザイン刷新（Solveページ以外の本格改修）
- ナビゲーション構造そのものの再設計

## 次に実装すべき順序（未対応項目）
1. モバイル時の凡例代替表示（簡略ラベル、折りたたみ、アイコン+ツールチップ等）を設計する。
2. セル `aria-label` を人間可読な文言へ変更し、関連UIテストを追加する。
3. 上記2項目のa11y観点の回帰確認（キーボード操作、読み上げ順、状態通知）を行う。

## 更新履歴
- 2026-02-22: 実装反映版へ全面更新。責務分離/CSS分離/閾値定数化/選択解除イベント整理/Backspace disabled連動を「対応済み」として反映。
- 2026-02-22: 数字入力UIの「Backspace常時押下可能/no-op」について、事実確認と状態別レポートを追記。
