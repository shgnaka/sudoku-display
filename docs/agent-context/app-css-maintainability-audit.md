# App CSS Maintainability Audit

## 目的 / 対象読者（coding agent）
`src/App.css` と Solve 画面CSS群の保守性を、実装判断がぶれない粒度で共有する。主対象は UI 改善を担当するコーディングエージェント。

## 調査日
2026-02-22

## 更新日
2026-02-22

## 現状サマリー
- 旧監査で課題だった「Solve専用スタイルの `src/App.css` 混在」は解消済み（`src/App.css`, `src/styles/solve-page.css`）。
- フォーカス可視性は `:focus-visible` ベースで実装済み（`src/styles/solve-page.base.css:190`, `src/styles/common-ui.css:86`）。
- Solve 状態色（`origin-*`, `legend-*`, `backspace`）はトークン化済みかつ利用済み（`src/styles/tokens.css:45`, `src/styles/tokens.css:55`, `src/styles/tokens.css:64`, `src/styles/solve-page.base.css:104`, `src/styles/common-ui.css:135`）。
- モバイル幅（`solve-no-scroll`）では `details/summary` の凡例導線を描画する構成へ更新済み（`src/pages/solve/SolveControlsPanel.tsx:53`, `src/styles/solve-page.base.css:104`, `src/components/__tests__/SudokuGrid.test.tsx:275`）。
- 768px ブレークポイント同期は App/Solve 両系統で注記済み（`src/styles/app-shell.css:173`, `src/styles/solve-page.base.css:280`, `src/styles/solve-page.no-scroll.css:113`, `src/constants/layout.ts:1`）。
- breakpoint 運用手順は `docs/agent-context/layout-breakpoint-operation-audit.md` に追加済み。
- typography token は `font-size/line-height/font-weight/font-family` まで統一済み（`src/styles/tokens.css`, `src/styles/common-ui.css`, `src/styles/solve-page.base.css`）。
- typography 運用チェックは `npm run lint:typography` で実行可能（`tools/lint-typography-tokens.mjs`, `package.json`）。
- spacing token は頻出値（2回以上登場）を中心に拡張済み（`src/styles/tokens.css`, `src/styles/common-ui.css`, `src/styles/app-shell.css`, `src/styles/solve-page.no-scroll.css`）。
- spacing 運用チェックは `npm run lint:spacing` で実行可能（`tools/lint-spacing-tokens.mjs`, `package.json`）。

## 旧監査項目の再評価（再基準化）

### High（旧）
1. CSS責務分離の不足
- 判定: `解消`
- 根拠: `src/App.css`, `src/styles/app-shell.css`, `src/styles/common-ui.css`, `src/styles/solve-page.css`

2. `solve-no-scroll` スタイルの散在
- 判定: `解消`
- 根拠: `src/styles/solve-page.no-scroll.css`

3. トークン不足によるハードコード増加
- 判定: `解消`
- 根拠: Solve 状態色トークンが追加済み（`src/styles/tokens.css:42`, `src/styles/tokens.css:61`）かつ利用済み（`src/styles/solve-page.base.css:249`, `src/styles/common-ui.css:135`）。

### Medium（旧）
1. ボタン系スタイルの重複
- 判定: `解消`
- 根拠: `btn + modifier` へ統一（`src/styles/common-ui.css`）

2. フォーカス表現の適用範囲が限定的
- 判定: `解消`
- 根拠: `:focus-visible` 実装済み（`src/styles/solve-page.base.css:190`, `src/styles/common-ui.css:86`）。

3. レスポンシブ条件の説明不足
- 判定: `解消`
- 根拠: BREAKPOINT 同期注記を App/Solve 側へ配置（`src/styles/app-shell.css:173`, `src/styles/solve-page.base.css:280`, `src/styles/solve-page.no-scroll.css:113`）し、定数と対応付け済み（`src/constants/layout.ts:1`）。

### Low（旧）
1. タイポグラフィ規則の分散
- 判定: `解消`
- 根拠: `font-size/line-height/font-weight/font-family` の生値指定を token 化し、`font` shorthand を解消（`src/styles/tokens.css`, `src/styles/common-ui.css`, `src/styles/solve-page.base.css`）。

2. 凡例のモバイル時完全非表示
- 判定: `解消`
- 根拠: `solve-no-scroll` 時に `details/summary` の凡例UIを描画（`src/pages/solve/SolveControlsPanel.tsx:53`, `src/components/__tests__/SudokuGrid.test.tsx:275`）。

## 現在の残課題（優先度・着手条件・完了条件）

### Low
1. 単発の余白・サイズ生値が一部残っている
- 問題: 頻出値（2回以上）の token 化は完了したが、単発値（例: `0.48rem`, `0.32rem`, `1.25rem`）は意図的に据え置いている。
- 参照: `src/styles/common-ui.css`, `src/styles/app-shell.css`, `src/styles/solve-page.base.css`
- 着手条件: レイアウト微調整を複数画面に跨って行うタスクが発生した時点。
- 完了条件:
  - 単発値のうち再利用されるものを `src/styles/tokens.css` へ昇格。
  - `lint:spacing` の禁止値セットと token を同期し、再発防止を維持する。

## 非目標（今回やらないこと）
- Sudoku ロジックや状態管理（TypeScript）の仕様変更
- ルーティングやページ構成の再設計
- 全ページの全面的なビジュアル刷新
- 新規デザインシステムの導入

## 次に実装すべき順序
1. 余白・サイズ値の頻出パターンを抽出し、spacing token を拡充する。
2. 凡例UIの開閉前後で理解しやすい文言・配置を実機幅で調整する。

## 更新履歴
- 2026-02-22: spacing token を頻出値（2回以上）へ拡張し、`lint:spacing` を追加。
- 2026-02-22: typography token を `font-size/line-height/font-weight/font-family` まで統一し、`lint:typography` を追加。
- 2026-02-22: ハードコード監査の追記として、カラー直書きと寸法値直書きの改善余地を追加。
- 2026-02-22: タイポグラフィ/カラー/spacing のトークン化、モバイル凡例導線、breakpoint 運用メモ追加を反映。
