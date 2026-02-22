# Solve Page UI Audit

## 目的 / 対象読者（coding agent）
SolveページのUI改善を行う際に、既存実装の課題と優先度を共有するための背景資料。主対象は実装担当のコーディングエージェント。

## 調査日
2026-02-22

## 現状要約
- Solveページは `src/pages/SolvePage.tsx` に状態管理・イベント制御・表示制御が集中している。
- スタイルは `src/App.css` に集約され、solve専用スタイルと全体スタイルが混在している。
- 画面幅に応じて入力方式を `keyboard` / `sheet` で切り替えているが、閾値・挙動の定義が分散している。
- 基本的なUIテストはあるが、改善時に影響範囲が広い構造になっている。

## 改善余地（優先度付き、ファイル:行番号付き）

### High
1. Solveページの責務分離不足
- 問題: 1コンポーネントに入力モード判定、選択状態、a11yアナウンス、外側タップ解除、UI構築が集中。
- 根拠: `src/pages/SolvePage.tsx:21`, `src/pages/SolvePage.tsx:113`, `src/pages/SolvePage.tsx:149`
- 期待効果: UI改修時の副作用を局所化でき、テストの粒度を上げやすくなる。

2. スタイル定義の混在
- 問題: solve専用CSSと全体CSSが同居しており、変更影響範囲の見通しが悪い。
- 根拠: `src/App.css:49`, `src/App.css:327`, `src/App.css:381`, `src/App.css:699`
- 期待効果: solveページの見た目改善を独立して進めやすくなる。

3. ブレークポイント定義の分散
- 問題: モバイル判定とsheet入力判定で閾値が別管理され、挙動理由が追いづらい。
- 根拠: `src/lib/useIsMobileViewport.ts:3`, `src/lib/useSolveInputSheetViewport.ts:3`, `src/App.css:699`
- 期待効果: レイアウト不具合の調査と閾値調整を一貫した方針で実施できる。

### Medium
1. セル選択解除イベントの重複監視
- 問題: `pointerdown/mousedown/touchstart/click` を重ねて登録している。
- 根拠: `src/pages/SolvePage.tsx:137`
- 期待効果: イベント処理の重複を減らし、誤反応や保守コストを下げられる。

2. 数字入力UIの状態一貫性
- 問題: 数字キーは無効化されるが、Backspaceは常時押下可能で条件によりno-opになる。
- 根拠: `src/pages/SolvePage.tsx:248`, `src/components/SolveNumberPad.tsx:24`
- 期待効果: 操作可能状態と実際の挙動の不一致を減らせる。

#### 2-1. 事実確認（Backspace挙動）
- 現在仕様として、Backspaceボタンには `disabled` が付与されていない。
  - 根拠: `src/components/SolveNumberPad.tsx:24`
- 数字キーのみ `numberDisabled` で無効化される。
  - 根拠: `src/components/SolveNumberPad.tsx:16`
- 親側は `numberDisabled={isReviewMode || selectedCell === null}` を渡しているが、Backspaceには適用されない。
  - 根拠: `src/pages/SolvePage.tsx:248`
- Backspaceの処理は `!selectedCell || isReviewMode` で早期returnし、実際の値変更は行われない（no-op）。
  - 根拠: `src/pages/SolvePage.tsx:104`
- テストも「Backspaceは非活性化されない」挙動を検証している。
  - 根拠: `src/components/__tests__/SudokuGrid.test.tsx:407`, `src/components/__tests__/SudokuGrid.test.tsx:419`
- 実行確認:
  - `npm run test -- --run src/components/__tests__/SudokuGrid.test.tsx -t "backspace|review mode|number keys"` を実行し、該当テストは通過。

#### 2-2. 状態別挙動マトリクス
| 入力モード | 状態 | 数字キー | Backspace | 結果 |
| --- | --- | --- | --- | --- |
| sheet | normal + selectedCellあり | 有効 | 有効 | 数字入力/消去とも機能する |
| sheet | normal + selectedCellなし | 無効 | 有効 | Backspaceは押下可能だがno-op |
| sheet | review | 無効 | 有効 | Backspaceは押下可能だがno-op |
| sheet | ink | 非表示 | 非表示 | number pad自体が非表示 |
| keyboard | 任意 | 非表示 | 非表示 | number pad自体が非表示 |

#### 2-3. ギャップと改善オプション（実装未決定）
- UXギャップ:
  - 「押せるが効かない」瞬間があり、操作一貫性が低下する。
  - 支援技術利用時に「操作可能」と誤認される余地がある。
- 改善オプション:
  - Option A: Backspaceも `numberDisabled` に連動してdisabled化する（状態一貫性を優先）。
  - Option B: 現仕様を維持しつつ、未選択/確認モード中の理由をUI文言で明示する（操作導線を優先）。
  - Option C: no-op時に `aria-live` で理由を通知する（アクセシビリティ補完を優先）。

3. モバイル時の凡例非表示
- 問題: `solve-no-scroll` 時に凡例を完全に非表示にしている。
- 根拠: `src/App.css:584`
- 期待効果: 色の意味理解を維持しつつ、省スペース表示の改善案を検討できる。

### Low
1. セルラベルの読み上げ情報量
- 問題: `aria-label` が `r1c1` 形式で、意味が直感的ではない。
- 根拠: `src/components/SudokuCell.tsx:81`, `src/components/SudokuCell.tsx:97`
- 期待効果: スクリーンリーダー利用時の理解速度を改善できる。

## 非目標（今回やらないこと）
- 盤面ロジック（解答判定、生成アルゴリズム）の変更
- WASM連携仕様の変更
- 全ページのデザイン刷新（Solveページ以外の本格改修）
- ナビゲーション構造そのものの再設計

## 次に実装すべき順序
1. `SolvePage` を責務分離し、選択制御・表示パネルを分割する。
2. solve関連CSSを分割し、`App.css` から責務を切り出す。
3. ブレークポイント・入力モード閾値を定数化して一元管理する。
4. 選択解除イベントを統一し、イベント重複を解消する。
5. 数字入力UIの有効/無効状態を整理し、操作一貫性を改善する。
6. モバイル時の凡例代替表示（簡略ラベル等）を設計する。
7. a11yラベル文言を改善し、必要なUIテストを追加する。

## 更新履歴
- 2026-02-22: 数字入力UIの「Backspace常時押下可能/no-op」について、事実確認と状態別レポートを追記。
