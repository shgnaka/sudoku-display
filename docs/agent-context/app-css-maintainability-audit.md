# App CSS Maintainability Audit

## 目的 / 対象読者（coding agent）
`src/App.css` と `src/styles/solve-page.css` 周辺の保守性を、実装判断がぶれない粒度で共有する。主対象は、UI改善を担当するコーディングエージェント。

## 調査日
2026-02-22

## 事実確認サマリー
- 旧監査で前提だった「Solve専用スタイルの `src/App.css` 混在」は、現状では解消済み。
- 現状の構成は、`src/App.css`（集約）+ `src/styles/app-shell.css` + `src/styles/common-ui.css` + `src/styles/solve-page.css`（集約）+ `src/styles/solve-page.base.css` + `src/styles/solve-page.no-scroll.css`。
- `solve-no-scroll` 条件セレクタは `src/styles/solve-page.no-scroll.css` へ集約済み。
- 重複しやすい色・半径・境界線は `src/styles/tokens.css` に共通トークン化済み。

## 旧監査項目の再評価

### High（旧）
1. CSS責務分離の不足
- 判定: `解消`
- 根拠: `src/App.css`, `src/styles/app-shell.css`, `src/styles/common-ui.css`, `src/styles/solve-page.css`

2. `solve-no-scroll` スタイルの散在
- 判定: `解消`
- 根拠: `src/styles/solve-page.no-scroll.css`

3. トークン不足によるハードコード増加
- 判定: `部分的に解消`
- 根拠: `src/styles/tokens.css` に主要トークン追加済み。ただし Solve専用の状態色（例: `origin-*`, `legend-*`, `backspace`）には個別値が残る。

### Medium（旧）
1. ボタン系スタイルの重複
- 判定: `解消`
- 根拠: `btn + modifier` へ統一（`src/styles/common-ui.css` の `.btn`, `.btn--*` と各TSXの `className` 移行）。

2. フォーカス表現の適用範囲が限定的
- 判定: `未対応`
- 根拠: `.sudoku-cell:focus` はあるが、`:focus-visible` の横断適用は未実施（`src/styles/solve-page.base.css`）。

3. レスポンシブ条件の説明不足
- 判定: `部分的に解消`
- 根拠: `BREAKPOINT_SYNC_NOTE` は存在（`src/styles/solve-page.no-scroll.css`）。ただし App側メディアクエリとの設計意図は文書化余地あり。

### Low（旧）
1. タイポグラフィ規則の分散
- 判定: `未対応`
- 根拠: サイズ/行間は複数ファイルで個別指定が残る。

2. 凡例のモバイル時完全非表示
- 判定: `未対応`
- 根拠: `.app-root.solve-no-scroll .solve-legend { display: none; }`（`src/styles/solve-page.no-scroll.css`）。

## 現在の改善余地（優先度付き）

### Medium
1. フォーカス可視性の統一
- 問題: `:focus-visible` が未導入で、要素ごとの操作確信性が揃っていない。
- 参照: `src/styles/solve-page.base.css` (`.sudoku-cell:focus`)
- 期待効果: キーボード操作時のアクセシビリティ向上。

2. レスポンシブ意図の補強
- 問題: App側とSolve側でメディアクエリが分かれ、設計意図の参照が分散。
- 参照: `src/styles/app-shell.css`, `src/styles/solve-page.base.css`, `src/styles/solve-page.no-scroll.css`
- 期待効果: 変更時の破綻防止。

### Low
1. Solve状態色のトークン化継続
- 問題: `origin-*`, `legend-*`, `backspace` 系色が局所ハードコード。
- 参照: `src/styles/solve-page.base.css`
- 期待効果: テーマ調整の容易化。

2. モバイル凡例の代替表示
- 問題: `solve-no-scroll` 時に凡例を非表示。
- 参照: `src/styles/solve-page.no-scroll.css` (`.solve-legend`)
- 期待効果: 初見理解性を保ちつつ省スペースを維持。

## 非目標（今回やらないこと）
- Sudokuロジックや状態管理（TypeScript）の仕様変更
- ルーティングやページ構成の再設計
- 全ページの全面的なビジュアル刷新
- 新規デザインシステムの導入

## 次に実装すべき順序
1. `:focus-visible` ベースでフォーカスリングを横断適用する。
2. ブレークポイント設計意図を最小コメントで補強する。
3. Solve専用状態色を段階的にトークン化する。
4. モバイル凡例の簡易代替表示（例: 1行要約）を導入する。
