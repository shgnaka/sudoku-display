# Solve Page UI Audit

## 目的 / 対象読者（coding agent）
SolveページのUI改善を行う際に、現行実装の状態（対応済み/残課題）と優先度を共有するための背景資料。主対象は実装担当のコーディングエージェント。

## 調査日
2026-02-22

## 現状要約
- `SolvePage` はコンテナ役へ整理され、選択制御・表示構築・入力UIが分割済み。
- solve専用スタイルは `src/styles/solve-page.css`（`solve-page.base.css` + `solve-page.no-scroll.css` の集約）として分離済み。
- 画面幅判定は `src/constants/layout.ts` の定数を参照する形へ一元化済み。
- sheet入力時の数字キーとBackspaceは同条件でdisabled化され、操作可能状態の一貫性が改善済み。
- `solve-no-scroll` 時の凡例は折りたたみ表示かつ省スペース化され、summary文言を短縮済み。
- セル `aria-label` は「座標＋状態＋編集可否（理由付き）」へ改善済み。
- sheet入力時の `aria-live` は状態変化通知中心へ整理し、`aria-label` との重複を低減済み。

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

3. モバイル時の凡例非表示
- 状態: 対応済み
- 根拠: `src/pages/solve/SolveBoardPanel.tsx:73`, `src/styles/solve-page.base.css:203`, `src/styles/solve-page.no-scroll.css:110`, `src/components/__tests__/SudokuGrid.test.tsx:270`
- 補足: `solve-no-scroll` でも `details/summary` による折りたたみ凡例を表示し、意味情報への到達性を維持。

4. セルラベルの読み上げ情報量
- 状態: 対応済み
- 根拠: `src/components/SudokuCell.tsx:19`, `src/components/SudokuCell.tsx:46`, `src/components/__tests__/SudokuGrid.test.tsx:89`
- 補足: `aria-label` を「1行3列、空、編集可能」のような人間可読文言へ統一。

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
- 実機スクリーンリーダー（VoiceOver/TalkBack）で文言妥当性を確認し、必要に応じて微調整する。

## 非目標（今回やらないこと）
- 盤面ロジック（解答判定、生成アルゴリズム）の変更
- WASM連携仕様の変更
- 全ページのデザイン刷新（Solveページ以外の本格改修）
- ナビゲーション構造そのものの再設計

## 実機確認チェックリスト（VoiceOver / TalkBack）
1. 盤面セルフォーカス時に「行列・状態・編集可否（理由）」が過不足なく読み上げられることを確認する。
2. sheetモードでセル選択時、`aria-live` が選択状態のみを簡潔に通知することを確認する。
3. sheetモードで数字入力/消去時、`aria-live` が値変更を正しく通知することを確認する。
4. reviewモード切替後に、編集不可セルの読み上げが「編集不可（確認モード）」として識別できることを確認する。
5. `solve-no-scroll` で凡例 `summary` が読み上げ可能で、展開後に各チップ文言へ到達できることを確認する。

## 次に実装すべき順序（未対応項目）
1. VoiceOver実機でチェックリストを実施し、結果を追記する。
2. TalkBack実機でチェックリストを実施し、結果を追記する。
3. 実機差分があれば `aria-label` / `aria-live` の文言を微修正する。

## 更新履歴
- 2026-02-22: 凡例summary文言とチップ密度を調整し、`aria-label` に編集不可理由を追加。sheet `aria-live` 文言を状態変化中心へ整理し、実機確認チェックリストを追記。
- 2026-02-22: 残課題だった「モバイル時の凡例非表示」「セル `aria-label` の情報不足」を実装反映し、関連UIテストを更新。
- 2026-02-22: 実装反映版へ全面更新。責務分離/CSS分離/閾値定数化/選択解除イベント整理/Backspace disabled連動を「対応済み」として反映。
- 2026-02-22: 数字入力UIの「Backspace常時押下可能/no-op」について、事実確認と状態別レポートを追記。
