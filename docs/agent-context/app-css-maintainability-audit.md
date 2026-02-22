# App CSS Maintainability Audit

## 目的 / 対象読者（coding agent）
`src/App.css` と Solve 画面CSS群の保守性を、実装判断がぶれない粒度で共有する。主対象は UI 改善を担当するコーディングエージェント。

## 調査日
2026-02-22

## 更新日
2026-02-22

## 現状サマリー
- 旧監査で課題だった「Solve専用スタイルの `src/App.css` 混在」は解消済み（`src/App.css`, `src/styles/solve-page.css`）。
- フォーカス可視性は `:focus-visible` ベースで実装済み（`src/styles/solve-page.base.css:132`, `src/styles/common-ui.css:86`）。
- Solve 状態色（`origin-*`, `backspace`）はトークン化済み（`src/styles/tokens.css:42`, `src/styles/tokens.css:61`）かつ利用済み（`src/styles/solve-page.base.css:190`, `src/styles/common-ui.css:135`）。
- `legend-*` トークンは定義済みだが、現状の Solve 画面には凡例UIが描画されていない（`src/styles/tokens.css:52`, `src/pages/SolvePage.tsx:75`, `src/components/__tests__/SudokuGrid.test.tsx:275`）。
- 768px ブレークポイント同期は App/Solve 両系統で注記済み（`src/styles/app-shell.css:173`, `src/styles/solve-page.base.css:221`, `src/styles/solve-page.no-scroll.css:105`, `src/constants/layout.ts:1`）。

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
- 根拠: Solve 状態色トークンが追加済み（`src/styles/tokens.css:42`, `src/styles/tokens.css:61`）かつ利用済み（`src/styles/solve-page.base.css:190`, `src/styles/common-ui.css:135`）。

### Medium（旧）
1. ボタン系スタイルの重複
- 判定: `解消`
- 根拠: `btn + modifier` へ統一（`src/styles/common-ui.css`）

2. フォーカス表現の適用範囲が限定的
- 判定: `解消`
- 根拠: `:focus-visible` 実装済み（`src/styles/solve-page.base.css:132`, `src/styles/common-ui.css:86`）。

3. レスポンシブ条件の説明不足
- 判定: `解消`
- 根拠: BREAKPOINT 同期注記を App/Solve 側へ配置（`src/styles/app-shell.css:173`, `src/styles/solve-page.base.css:221`, `src/styles/solve-page.no-scroll.css:105`）し、定数と対応付け済み（`src/constants/layout.ts:1`）。

### Low（旧）
1. タイポグラフィ規則の分散
- 判定: `未対応`
- 根拠: 文字サイズ/行間は各ファイルで局所指定が残る（例: `src/styles/solve-page.base.css`）。

2. 凡例のモバイル時完全非表示
- 判定: `未対応`
- 根拠: `solve-no-scroll` 時に凡例UIは描画されない状態（`src/pages/SolvePage.tsx:75`, `src/components/__tests__/SudokuGrid.test.tsx:275`）。

## 現在の残課題（優先度・着手条件・完了条件）

### Medium
1. タイポグラフィトークンの段階的統一
- 問題: フォントサイズ/行間の指定がページ別に分散し、調整時に差分追跡が必要。
- 参照: `src/styles/solve-page.base.css`, `src/styles/app-shell.css`, `src/styles/common-ui.css`
- 着手条件: 次回の UI テキスト調整、または可読性改善タスクを開始する時点。
- 完了条件:
  - 主要テキストサイズ/行間を `src/styles/tokens.css` の semantic token へ移管。
  - 各ページCSSで同義の生値フォント指定を削減し、重複規則を解消。

2. ブレークポイント運用ルールの明文化
- 問題: 同期注記はあるが、「新規メディアクエリ追加時の運用手順」が文書化されていない。
- 参照: `src/styles/app-shell.css:173`, `src/styles/solve-page.base.css:221`, `src/styles/solve-page.no-scroll.css:105`, `src/constants/layout.ts:1`
- 着手条件: 768px 以外の新規 breakpoint を導入する設計変更が発生した時点。
- 完了条件:
  - `docs/agent-context/` 配下に breakpoint 運用メモ（定数起点・コメント方針・チェック観点）を追加。
  - CSS と TS 定数の同期確認手順を 1 箇所に集約。

3. 色指定の一部が design token を経由していない
- 問題: ボタン状態色の一部が16進カラー値で直書きされており、配色調整時に変更点が追いづらい。
- 参照: `src/styles/common-ui.css:99`, `src/styles/common-ui.css:111`, `src/styles/common-ui.css:149`
- 着手条件: 次回の配色調整またはアクセシビリティ改善（コントラスト見直し）に着手する時点。
- 完了条件:
  - 直書きカラーを `src/styles/tokens.css` の semantic token へ移管。
  - 利用側 CSS で生のカラーコードを削減し、用途名ベース参照へ統一。

### Low
1. 凡例情報の省スペース表現の改善
- 問題: `solve-no-scroll` では凡例UIが表示されず、状態色の意味を画面上で確認できない。
- 参照: `src/pages/SolvePage.tsx:75`, `src/components/__tests__/SudokuGrid.test.tsx:275`, `src/styles/tokens.css:52`
- 着手条件: モバイル UX 改善のバックログを着手する時点。
- 完了条件:
  - モバイル幅（`solve-no-scroll`）でも状態色の意味を確認できる凡例導線を提供する。
  - 画面密度を維持しつつ、初見ユーザーが色の意味を把握できることを手動確認する。

2. 余白・サイズ値の生値指定が散在している
- 問題: `padding/gap/font-size` などの寸法値が多数直書きで、全体調整時の一括変更が難しい。
- 参照: `src/styles/app-shell.css:176`, `src/styles/app-shell.css:191`, `src/styles/solve-page.no-scroll.css:38`, `src/styles/solve-page.base.css:233`
- 着手条件: レイアウト微調整を複数画面に跨って行うタスクが発生した時点。
- 完了条件:
  - 反復利用される寸法値を `src/styles/tokens.css` に昇格。
  - 同義の生値指定を削減し、影響範囲をトークン単位で追える状態にする。

## 非目標（今回やらないこと）
- Sudoku ロジックや状態管理（TypeScript）の仕様変更
- ルーティングやページ構成の再設計
- 全ページの全面的なビジュアル刷新
- 新規デザインシステムの導入

## 次に実装すべき順序
1. タイポグラフィ関連の semantic token を `src/styles/tokens.css` へ追加し、Solve/App で共通利用する。
2. breakpoint 運用メモを `docs/agent-context/` に追加し、`MOBILE_BREAKPOINT_PX` 起点の同期ルールを明文化する。
3. モバイル幅（`solve-no-scroll`）で状態色の意味を把握できる凡例導線を追加し、表示密度との両立を調整する。

## 更新履歴
- 2026-02-22: ハードコード監査の追記として、カラー直書きと寸法値直書きの改善余地を追加。
