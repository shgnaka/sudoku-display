# App Hardcoded Values Audit

## 目的 / 対象読者（coding agent）
アプリ実装に散在するハードコード値を、改善実装の判断がぶれない粒度で整理する。主対象は TypeScript/Rust/UI 文言の保守改善を担当するコーディングエージェント。

## 調査日
2026-02-22

## 更新日
2026-02-22

## 現状要約
- High/Medium/Low で整理した主要ハードコード値の集約を完了し、`src/constants` と静的アセットへ段階移行した。
- CSS 系のハードコードは既存監査（`layout-breakpoint-sync-audit.md`, `app-css-maintainability-audit.md`）に寄せ、ここでは非CSSの値を主対象にする。
- ドメイン上固定で妥当な値（例: 9x9）の存在自体は問題ではなく、「定義の分散」と「同義値の重複」を改善対象とする（本監査対象は実装済み）。

## 改善余地（優先度付き、ファイル:行番号付き）

### High
1. ルート文字列とフォールバック遷移先の直書き
- 問題: ルート定義自体は集約されていたが、フォールバック遷移先（`#/solve`）とルート参照元が `navigation.ts` へ暗黙集中しており、責務分離が弱い。
- 根拠: `src/lib/navigation.ts:1`, `src/lib/navigation.ts:18`, `src/lib/navigation.ts:22`
- 期待効果: ルート変更の影響範囲が明確になり、遷移不具合の混入を抑制できる。
- 実装メモ（2026-02-22）: `src/constants/routes.ts` を追加し、`APP_ROUTES` / `DEFAULT_ROUTE_HASH` / `MOBILE_DRAWER_ROUTES` を集約した。

2. localStorage キーの重複定義
- 問題: 保存キーがモジュール単位で個別定義され、命名規則の統一やバージョン更新時に漏れが生じる。
- 根拠: `src/lib/gameStorage.ts:4`, `src/lib/inkStorage.ts:6`
- 期待効果: 保存スキーマ変更時の移行設計と影響調査が容易になる。
- 実装メモ（2026-02-22）: `src/constants/storageKeys.ts:1` を追加し、`game` / `ink` キー参照を共通化した（キー値は据え置き）。

3. 難易度値と選択肢の多重管理
- 問題: `easy/medium/hard` が TypeScript 型、UI 選択肢、Rust 側 difficulty 判定に分散し、同期コストが高い。
- 根拠: `src/constants/difficulty.ts:1`, `src/pages/ManagePage.tsx:36`, `rust/sudoku_generator/src/lib.rs:96`
- 期待効果: 難易度仕様変更時の修正箇所を最小化し、TS/Rust 間の齟齬を予防できる。
- 実装メモ（2026-02-22）: `src/constants/difficulty.ts:1` を追加し、TS側の difficulty 型と選択肢を単一ソース化した。Rust 側は既存仕様を維持。

### Medium
1. 数独ドメイン定数の分散（9, 81, 1..9）
- 問題: 盤面サイズや入力値域の定数が複数実装に散在し、仕様変更・仕様確認時に見通しが悪い。
- 根拠: `src/constants/sudokuDomain.ts:1`, `src/lib/sudokuParser.ts:27`, `src/lib/sudokuFormatter.ts:4`, `src/components/SudokuCell.tsx:74`, `src/state/SudokuAppStateProvider.tsx:83`, `rust/sudoku_generator/src/lib.rs:5`
- 期待効果: 数独ドメイン仕様の参照点を一元化し、実装間の整合を保ちやすくなる。
- 実装メモ（2026-02-22）: `src/constants/sudokuDomain.ts` を追加し、TS 側の `9/81/1..9/0` 参照を集約。Rust 側に `MIN_CELL_VALUE`/`MAX_CELL_VALUE` を追加し、`src/constants/__tests__/sudokuDomain.contract.test.ts` と Rust テストで契約を検証する形にした。

2. ブロックID列挙と初期値の直書き
- 問題: `0-0`〜`2-2` の列挙と初期アクティブ値が分離管理され、将来の表現変更時に同期が必要。
- 根拠: `src/types/ink.ts:20`, `src/constants/ink.ts:3`, `src/state/SudokuAppStateProvider.tsx:105`, `src/components/InkOverlay.tsx:25`
- 期待効果: ブロック表現変更時の修正箇所を減らし、初期値の妥当性を担保しやすくなる。
- 実装メモ（2026-02-22）: `src/constants/ink.ts` を追加して初期アクティブ値を定数化し、`InkOverlay` 側のキャンバス参照初期化を `BLOCK_IDS` ベース生成に変更した。

3. UI 入力閾値・描画設定の直書き
- 問題: キーボード検知閾値・最小盤面サイズ・インク線設定が局所定義で、調整時に変更方針が分散する。
- 根拠: `src/constants/uiTuning.ts:1`, `src/lib/useKeyboardInset.ts:2`, `src/lib/useBoardFitSize.ts:3`, `src/components/InkOverlay.tsx:3`
- 期待効果: UX チューニング時の変更ルールを定義しやすくなり、端末差異対応の検証がしやすくなる。
- 実装メモ（2026-02-22）: `src/constants/uiTuning.ts` に閾値・描画設定を集約し、対象3ファイルを定数参照へ置換した。

### Low
1. UI 文言のコンポーネント内直書き
- 問題: 確認メッセージや説明文が各コンポーネントに埋め込まれており、文言修正や将来の i18n 対応が重い。
- 根拠: `src/constants/messages.ts:1`, `src/pages/StoragePage.tsx:2`, `src/pages/HelpPage.tsx:1`, `src/pages/NotFoundPage.tsx:1`
- 期待効果: 文言管理の集中化により、表示品質改善や多言語化の準備コストを下げられる。
- 実装メモ（2026-02-22）: `src/constants/messages.ts` を追加し、Storage/Help/NotFound の文言を参照化した（i18n基盤は未導入）。

2. 既定パズルデータの埋め込み
- 問題: デフォルト問題がコード埋め込みで、差し替え時に実装ファイル編集が必須になる。
- 根拠: `public/puzzles/default.txt:1`, `src/lib/defaultPuzzle.ts:15`, `src/state/SudokuAppStateProvider.tsx:116`
- 期待効果: 初期データ変更の運用が明確になり、検証用データ差し替えが容易になる。
- 実装メモ（2026-02-22）: 既定問題を `public/puzzles/default.txt` に外出しし、`loadDefaultPuzzleText()` 経由で読込。失敗時は埋め込み予備値へフォールバックする。

3. WASM モジュールパスの直書き
- 問題: モジュール読み込みパスが実装内に固定され、ビルド構成変更時の追従点が限定されていない。
- 根拠: `src/constants/wasm.ts:1`, `src/wasm/sudokuGenerator.ts:2`, `src/wasm/sudokuGenerator.ts:41`
- 期待効果: 配置変更時の修正方針が明確になり、環境差分による読み込み不具合を減らせる。
- 実装メモ（2026-02-22）: `src/constants/wasm.ts` を追加し、WASM モジュールパス参照を一元化した。

## 非目標（今回やらないこと）
- ルーティング方式（hash/router）自体の再設計
- i18n 基盤の導入
- Rust 生成アルゴリズム自体の仕様変更

## 次に実装すべき順序
1. `src/constants` 配下の集約先（`routes` / `storageKeys` / `difficulty` / `sudokuDomain` / `uiTuning` / `messages` / `wasm` / `ink`）を維持し、新規値の直書きを防ぐ。
2. TS/Rust 契約テスト（難易度・ドメイン定数）を CI で継続実行し、仕様変更時の更新手順を明文化する。
3. 既定パズル差し替え運用（`public/puzzles/default.txt`）を README などに追記し、検証データ更新フローを固定化する。
4. i18n 導入時は `messages.ts` をキー辞書化する移行計画を別監査で起票する。

## 更新履歴（任意）
- 2026-02-22: 初版作成。非CSSのハードコード改善余地を優先度付きで整理。
- 2026-02-22: High のうち `routes` / `storageKeys` / `difficulty` の集約を実装済み状態に更新。
- 2026-02-22: Medium/Low（ドメイン定数、ブロックID初期値、UI閾値、文言、既定パズル外出し、WASMパス）を実装済み状態に更新。
