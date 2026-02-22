# App Hardcoded Values Audit

## 目的 / 対象読者（coding agent）
アプリ実装に散在するハードコード値を、改善実装の判断がぶれない粒度で整理する。主対象は TypeScript/Rust/UI 文言の保守改善を担当するコーディングエージェント。

## 調査日
2026-02-22

## 更新日
2026-02-22

## 現状要約
- ルーティング、ストレージキー、難易度、数独ドメイン値、UI 閾値、文言が複数ファイルに分散して直書きされている。
- CSS 系のハードコードは既存監査（`layout-breakpoint-sync-audit.md`, `app-css-maintainability-audit.md`）に寄せ、ここでは非CSSの値を主対象にする。
- ドメイン上固定で妥当な値（例: 9x9）の存在自体は問題ではなく、「定義の分散」と「同義値の重複」を改善対象とする。

## 改善余地（優先度付き、ファイル:行番号付き）

### High
1. ルート文字列とフォールバック遷移先の直書き
- 問題: `#/solve` などのルート文字列が複数箇所に存在し、追加・変更時に不整合が発生しやすい。
- 根拠: `src/lib/navigation.ts:2`, `src/lib/navigation.ts:3`, `src/lib/navigation.ts:4`, `src/lib/navigation.ts:5`, `src/lib/navigation.ts:34`, `src/lib/navigation.ts:38`
- 期待効果: ルート変更の影響範囲が明確になり、遷移不具合の混入を抑制できる。

2. localStorage キーの重複定義
- 問題: 保存キーがモジュール単位で個別定義され、命名規則の統一やバージョン更新時に漏れが生じる。
- 根拠: `src/lib/gameStorage.ts:3`, `src/lib/inkStorage.ts:5`
- 期待効果: 保存スキーマ変更時の移行設計と影響調査が容易になる。

3. 難易度値と選択肢の多重管理
- 問題: `easy/medium/hard` が TypeScript 型、UI 選択肢、Rust 側 difficulty 判定に分散し、同期コストが高い。
- 根拠: `src/wasm/sudokuGenerator.ts:1`, `src/pages/ManagePage.tsx:30`, `rust/sudoku_generator/src/lib.rs:96`
- 期待効果: 難易度仕様変更時の修正箇所を最小化し、TS/Rust 間の齟齬を予防できる。

### Medium
1. 数独ドメイン定数の分散（9, 81, 1..9）
- 問題: 盤面サイズや入力値域の定数が複数実装に散在し、仕様変更・仕様確認時に見通しが悪い。
- 根拠: `src/lib/sudokuParser.ts:26`, `src/lib/sudokuFormatter.ts:2`, `src/components/SudokuCell.tsx:61`, `src/state/SudokuAppStateProvider.tsx:81`, `rust/sudoku_generator/src/lib.rs:5`
- 期待効果: 数独ドメイン仕様の参照点を一元化し、実装間の整合を保ちやすくなる。

2. ブロックID列挙と初期値の直書き
- 問題: `0-0`〜`2-2` の列挙と初期アクティブ値が分離管理され、将来の表現変更時に同期が必要。
- 根拠: `src/types/ink.ts:20`, `src/state/SudokuAppStateProvider.tsx:101`
- 期待効果: ブロック表現変更時の修正箇所を減らし、初期値の妥当性を担保しやすくなる。

3. UI 入力閾値・描画設定の直書き
- 問題: キーボード検知閾値・最小盤面サイズ・インク線設定が局所定義で、調整時に変更方針が分散する。
- 根拠: `src/lib/useKeyboardInset.ts:3`, `src/lib/useBoardFitSize.ts:4`, `src/components/InkOverlay.tsx:20`, `src/components/InkOverlay.tsx:21`
- 期待効果: UX チューニング時の変更ルールを定義しやすくなり、端末差異対応の検証がしやすくなる。

### Low
1. UI 文言のコンポーネント内直書き
- 問題: 確認メッセージや説明文が各コンポーネントに埋め込まれており、文言修正や将来の i18n 対応が重い。
- 根拠: `src/pages/StoragePage.tsx:7`, `src/pages/HelpPage.tsx:5`, `src/pages/NotFoundPage.tsx:9`
- 期待効果: 文言管理の集中化により、表示品質改善や多言語化の準備コストを下げられる。

2. 既定パズルデータの埋め込み
- 問題: デフォルト問題がコード埋め込みで、差し替え時に実装ファイル編集が必須になる。
- 根拠: `src/lib/defaultPuzzle.ts:1`
- 期待効果: 初期データ変更の運用が明確になり、検証用データ差し替えが容易になる。

3. WASM モジュールパスの直書き
- 問題: モジュール読み込みパスが実装内に固定され、ビルド構成変更時の追従点が限定されていない。
- 根拠: `src/wasm/sudokuGenerator.ts:38`
- 期待効果: 配置変更時の修正方針が明確になり、環境差分による読み込み不具合を減らせる。

## 非目標（今回やらないこと）
- 実コードの定数集約リファクタリング
- ルーティング方式（hash/router）自体の再設計
- i18n 基盤の導入
- Rust 生成アルゴリズム自体の仕様変更

## 次に実装すべき順序
1. `src/constants` に `routes` と `storageKeys` の集約先を追加し、参照を段階的に置換する。
2. 難易度仕様を TS/Rust で突合できる形に整理し、UI 選択肢との同期テストを追加する。
3. 数独ドメイン定数（サイズ・値域）を共通化し、parser/formatter/model の参照を統一する。
4. UI 閾値・描画設定を専用定数へ集約し、端末別の回帰確認項目を定義する。
5. 文言と既定パズルデータの外出し方針を決め、段階的に移行する。

## 更新履歴（任意）
- 2026-02-22: 初版作成。非CSSのハードコード改善余地を優先度付きで整理。
