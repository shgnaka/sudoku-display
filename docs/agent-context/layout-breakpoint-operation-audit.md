# Layout Breakpoint Operation Audit

## 目的 / 対象読者（coding agent）
`MOBILE_BREAKPOINT_PX` を基準に、CSS と TS の breakpoint 定義を同期して運用するための実装ルールを共有する。主対象はレイアウト変更を行うコーディングエージェント。

## 調査日
2026-02-22

## 更新日
2026-02-22

## 現状
- 768px の同期注記は以下に配置済み。
  - `src/styles/app-shell.css`
  - `src/styles/solve-page.base.css`
  - `src/styles/solve-page.no-scroll.css`
- 定数側の基準値は `src/constants/layout.ts` の `MOBILE_BREAKPOINT_PX`。
- 既存の同期チェックは `npm run lint:breakpoints` で実行可能。

## 運用ルール
1. 既存のモバイル判定を変更する場合は、必ず `src/constants/layout.ts` の `MOBILE_BREAKPOINT_PX` を起点にする。
2. CSS 側で `@media (max-width: 768px)` を編集する場合は、`BREAKPOINT_SYNC_NOTE` コメントを維持する。
3. 新規にモバイル系メディアクエリを追加する場合は、既存コメントと同一文面で注記を追加する。
4. 実装後は `npm run lint:breakpoints` を実行し、注記と定数の不整合がないことを確認する。

## 新規 breakpoint 追加時の手順
1. `src/constants/layout.ts` に新規定数を追加する（例: `TABLET_BREAKPOINT_PX`）。
2. 利用側の TS ロジック（viewport hook など）で新規定数を参照する。
3. 対応する CSS の `@media` に `BREAKPOINT_SYNC_NOTE` コメントを追加する。
4. `npm run lint:breakpoints` を実行し、同期漏れがないことを確認する。

## チェック観点
- 変更した px 値が TS 定数と CSS で一致している。
- メディアクエリ追加時に同期注記が欠落していない。
- 実際の画面切り替え境界で UI 崩れが発生していない（手動確認）。

