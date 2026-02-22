# Layout Breakpoint Sync Audit

## 目的 / 対象読者（coding agent）
Viewport breakpoint の値と運用手順を、TypeScript 定数と CSS の両方で同期させるための実務メモ。主対象はレイアウト変更やレスポンシブ調整を行うコーディングエージェント。

## 調査日
2026-02-22

## 更新日
2026-02-22

## 現状要約
- breakpoint の定数は `src/constants/layout.ts` に集約され、`MOBILE_BREAKPOINT_PX = 768` と `SOLVE_INPUT_SHEET_BREAKPOINT_PX = 1024` が定義されている（`src/constants/layout.ts:1`, `src/constants/layout.ts:2`）。
- viewport 判定フックは共通関数 `createMaxWidthMediaQuery` を使い、定数から media query を生成している（`src/lib/useIsMobileViewport.ts:2`, `src/lib/useSolveInputSheetViewport.ts:2`）。
- CSS 側の `@media (max-width: 768px)` は `app-shell` / `solve-page.base` / `solve-page.no-scroll` / `common-ui` に分散し、`BREAKPOINT_SYNC_NOTE` で `MOBILE_BREAKPOINT_PX` と同期する運用になっている（`src/styles/app-shell.css:173`, `src/styles/solve-page.base.css:248`, `src/styles/solve-page.no-scroll.css:142`, `src/styles/common-ui.css:172`）。
- TS 側の query 文字列整合と hook 利用は `viewportBreakpoints` テストで担保される（`src/lib/__tests__/viewportBreakpoints.test.tsx:1`）。
- CSS 側の同期運用は `lint:breakpoints` で担保される（`tools/lint-breakpoint-sync.mjs:1`, `package.json:10`）。
- CI（GitHub Pages workflow）では `npm run lint:styles` を実行し、`lint:breakpoints` と `lint:typography` をビルド前に検証する（`.github/workflows/deploy-pages.yml`）。
- `SOLVE_INPUT_SHEET_BREAKPOINT_PX = 1024` は現状 TypeScript 側判定（`useSolveInputSheetViewport`）で使われ、CSS の `@media (max-width: 1024px)` は未使用（`src/lib/useSolveInputSheetViewport.ts:4`）。

## 改善余地（優先度付き、ファイル:行番号付き）

### High
1. `768px` の breakpoint 値が CSS 側で直書きされている
- 問題: `MOBILE_BREAKPOINT_PX` を定義していても、CSS 側は `@media (max-width: 768px)` の生値で管理しており、変更時に定数と乖離するリスクがある。
- 根拠: `src/styles/app-shell.css:174`, `src/styles/solve-page.base.css:249`, `src/styles/solve-page.no-scroll.css:143`, `src/styles/common-ui.css:173`, `src/constants/layout.ts:1`
- 期待効果: breakpoint 変更時の差分漏れを減らし、レビュー時に確認すべき箇所を固定化できる。

### Medium
1. breakpoint 変更時の更新対象が文書化されていない
- 問題: どのファイルを同時更新するかがコードコメントに分散し、作業者依存になりやすい。
- 根拠: `src/styles/app-shell.css:173`, `src/styles/solve-page.base.css:248`, `src/styles/solve-page.no-scroll.css:142`, `src/styles/common-ui.css:172`
- 期待効果: 変更漏れの防止とレビュー観点の固定化。

2. 1024px 系 breakpoint の CSS 側運用ルールが未定義
- 問題: `SOLVE_INPUT_SHEET_BREAKPOINT_PX` は TS 側に存在するが、CSS 側の採用・命名・注記方針が決まっていない。
- 根拠: `src/constants/layout.ts:2`, `src/lib/useSolveInputSheetViewport.ts:2`
- 期待効果: 新規 breakpoint 追加時の設計判断を削減。

### Low
1. 運用チェックの実行手順が監査文書に統合されていない
- 問題: 実装とチェック手段が分離されていると、変更時の確認手順が漏れやすい。
- 根拠: `src/lib/__tests__/viewportBreakpoints.test.tsx:1`, `tools/lint-breakpoint-sync.mjs:1`
- 期待効果: 変更時の品質確認を標準化できる。

## 運用ルール（この文書を基準に固定）
1. Single Source of Truth は `src/constants/layout.ts` とする。
2. CSS で `@media (max-width: 768px)` を使う場合、必ず直前に `BREAKPOINT_SYNC_NOTE` を付ける。
3. `BREAKPOINT_SYNC_NOTE` 行には `MOBILE_BREAKPOINT_PX` と `src/constants/layout.ts` 参照を含める。
4. 新しい breakpoint を導入する場合、先に `src/constants/layout.ts` へ定数を追加してから利用側を更新する。
5. viewport 判定が必要な TS 側処理は、定数を直接文字列化せず `createMaxWidthMediaQuery` を使う。
6. CSS に新規 breakpoint を追加したら、同一意図の TS 側判定（hook/utility）が必要かを必ず確認する。
7. `SOLVE_INPUT_SHEET_BREAKPOINT_PX (1024)` は現状 TS 側専用とし、CSS で導入する場合は lint ルールとテストを同時追加する。

## 変更時の実施手順
1. `src/constants/layout.ts` の定数を更新または追加する。
2. TS 側の利用箇所（例: `useIsMobileViewport`, `useSolveInputSheetViewport`）で定数参照を更新する。
3. CSS 側の該当 `@media` を更新し、`BREAKPOINT_SYNC_NOTE` の参照先定数が正しいか確認する。
4. `npm run lint:breakpoints` を実行し、CSS 同期ルール（対象ファイル・注記・1024px 未使用）を確認する。
5. `npm run test -- viewportBreakpoints` を実行し、TS 側の media query 整合を確認する。
6. UI 手動確認を行い、モバイル幅/タブレット幅で意図したレイアウトになることを検証する。

## 変更時チェックリスト
- [ ] `src/constants/layout.ts` の定数名と値が変更意図に合っている。
- [ ] TS 側の `window.matchMedia` 呼び出しは定数起点の query になっている。
- [ ] CSS 側の `@media (max-width: 768px)` は対象4ファイル（`app-shell`, `solve-page.base`, `solve-page.no-scroll`, `common-ui`）に限定されている。
- [ ] `BREAKPOINT_SYNC_NOTE` が各 `@media (max-width: 768px)` の直前にあり、`MOBILE_BREAKPOINT_PX` と `src/constants/layout.ts` を含む。
- [ ] `@media (max-width: 1024px)` を CSS に追加する場合、`SOLVE_INPUT_SHEET_BREAKPOINT_PX` と同期する lint ルール・テストを同時追加している。
- [ ] `npm run lint:breakpoints` が通る。
- [ ] `npm run test -- viewportBreakpoints` が通る。

## 非目標（今回やらないこと）
- 全 CSS を JS 生成 media query に置き換える設計変更
- Container Query への全面移行
- 全ページの breakpoint 体系再設計

## 次に実装すべき順序
1. 本文書を breakpoint 変更時の標準手順として採用する。
2. breakpoint 変更時に `lint:breakpoints` と `viewportBreakpoints` をセットで実行する。
3. 1024px の CSS 利用が必要になった時点で、lint ルールとテストを同時拡張する。

## 更新履歴
- 2026-02-22: 初版作成。
- 2026-02-22: ハードコード監査の観点を追加し、`768px` 直書きの優先度を High に更新。
- 2026-02-22: `common-ui.css` の `768px` 対象漏れを修正し、CSS 同期テスト運用を追記。
- 2026-02-22: `lint:breakpoints` を導入し、CSS 同期チェックを Node スクリプトへ移管。
- 2026-02-22: GitHub Pages workflow に `npm run lint:styles` を追加し、スタイル lint をCI実行へ移行。
