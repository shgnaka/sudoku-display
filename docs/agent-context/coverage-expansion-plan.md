# [PLAN] Coverage 対象拡張（lib + state から全体へ）

## 目的 / 対象読者（coding agent）
`test:coverage` の対象を現行の `lib + state` 限定から段階的に拡張し、最終的に global threshold（lines 95 / branches 90）を全体適用で安定運用する。対象はテスト基盤・テストケース追加・CI運用を担当する coding agent。

## 作成日
2026-02-23

## 優先度 / 状態
- 優先度: High
- status: `TODO`

## 現状スナップショット
1. `npm run test:coverage` は成功している。
- 実測: Lines 97.76%, Branches 95.55%（2026-02-23 時点）

2. coverage 対象は `vite.config.ts` の include で限定されている。
- 対象: `src/lib/sudokuParser.ts`, `src/lib/gameStorage.ts`, `src/lib/inkStorage.ts`, `src/state/**/*.ts`, `src/state/**/*.tsx`

3. CI 実行順は維持済み。
- `test:critical` -> `test:coverage` -> `test`

## 最終ゴール
1. coverage include を実質アプリ全体へ拡張する。
- 目標 include: `src/**/*.{ts,tsx}`
- 除外候補: `src/**/*.test.ts`, `src/**/*.test.tsx`, `src/main.tsx`, `src/vite-env.d.ts`

2. global threshold を全体で成立させる。
- Lines: 95
- Branches: 90

## Out of Scope
- E2E（Playwright/Cypress）導入
- 機能仕様変更（本番コードの振る舞い変更）
- Mutation testing の導入

## 段階移行計画（固定）
### Stage A: 対象範囲拡張の準備
1. `vite.config.ts` の coverage include/exclude を拡張し、影響範囲を可視化する。
2. 初回 `npm run test:coverage` を実行し、不足ファイル群を抽出する。
3. 不足をカテゴリ分けする。
- `src/pages/**`
- `src/components/**`
- `src/lib/**`（残差分岐）
- `src/state/**`（残差分岐）

完了条件:
- 不足ファイル一覧と不足理由（未到達分岐）を文書化済み。

### Stage B: 不足領域のテスト追加
1. 優先順位 P1（pages）から追加する。
- 画面遷移、エラー表示、モード遷移、入力制御を中心に分岐を追加。

2. 優先順位 P2（components）へ展開する。
- UI操作の状態遷移（enabled/disabled、表示切替、ハンドラ呼び出し）を追加。

3. 優先順位 P3（lib/state）の残差分岐を埋める。
- 既存ケースで未到達の guard/catch/default 分岐を補完。

4. 追加テスト方針を厳守する。
- `querySelector` / `querySelectorAll` / className 依存を避ける。
- 振る舞い（role/name/visible text/attribute）で検証する。
- `waitFor` は非同期反映時のみ使用する。

完了条件:
- coverage 実測が global threshold に対し収束傾向（95/90に到達または直前）となる。

### Stage C: 閾値固定と運用確定
1. `vite.config.ts` を global threshold 前提の最終形に固定する。
2. `npm run test:coverage` が安定成功することを確認する。
3. CI で連続成功を確認する。

完了条件:
- local/CI の双方で coverage gate が安定成功。

## 優先順位（固定）
1. P1: `src/pages/**`
2. P2: `src/components/**`
3. P3: `src/lib/**`, `src/state/**` の残差分岐
4. P4: 定数・薄いラッパー

## 実行手順（他Codex向け）
1. `git checkout -b test/coverage-scope-expansion` で作業ブランチを作成。
2. Stage A を実施し、不足領域を列挙。
3. Stage B を P1 -> P2 -> P3 の順で実施。
4. Stage C で global 95/90 を確定。
5. 次のコマンドで最終確認。
- `npm run test:critical`
- `npm run test:coverage`
- `npm run test`

## コミット戦略（固定）
1. `test: expand coverage include scope`
2. `test: add coverage scenarios for pages and components`
3. `test: fill remaining branch gaps in lib/state`
4. `test: enforce global coverage threshold 95/90`

## 受け入れ基準
1. `npm run test:coverage` が global 95/90 で成功。
2. `npm run test:critical` / `npm run test` が成功。
3. UIテストが実装詳細依存に戻っていない。
4. CI で `test:critical -> test:coverage -> test` が成功。

## チェックリスト
- [ ] include 範囲拡張済み
- [ ] 不足分岐の優先順位付け完了
- [ ] pages/components の不足テスト追加完了
- [ ] lib/state の残差分岐補完完了
- [ ] `npm run test:coverage` が global 95/90 で成功
- [ ] CI workflow で連続成功

## 更新履歴
- 2026-02-23: 初版作成（coverage 対象拡張計画を明文化）。
