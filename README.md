# sudoku-display

数独のテキスト形式を見やすい 9x9 グリッドで表示し、空マスを編集できる Web アプリです。

## セットアップ（Rust + WASM 含む）

### 必須ツール

- Node.js 20+
- Rust（`rustup` 経由推奨）
- `wasm32-unknown-unknown` ターゲット
- `wasm-pack`

```bash
rustup target add wasm32-unknown-unknown
cargo install wasm-pack --locked
```

Windows の場合は PATH 設定と Build Tools 不足で失敗することがあるため、`wasm-pack --version` が通ることを先に確認してください。

### 開発起動

```bash
npm install
npm run wasm:build
npm run dev
```

### 本番ビルド

```bash
npm run build
```

`npm run build` は内部で `npm run wasm:build` と `npm run wasm:verify` を実行し、`public/wasm/pkg` に生成物を配置します。
`npm run wasm:verify` は `__wbindgen_externrefs` が grow 可能な externref テーブルへ正しくバインドされているかを検証します。`WebAssembly.Table.grow(): failed to grow table by 4` が出る場合は、まずこのコマンドで WASM 生成物を確認してください。

## 公開URL

- https://shgnaka.github.io/sudoku-display/

## GitHub Pages 自動デプロイ

1. GitHub の対象リポジトリで `Settings > Pages` を開く
2. `Source` を `GitHub Actions` に設定する
3. `main` ブランチへ push すると `.github/workflows/deploy-pages.yml` が実行される
4. 成功後、上記URLで公開内容を確認する

## 主な仕様

- テキスト入力を自動パースして即時反映
- Rust + WASM で数独を生成（Easy / Medium / Hard）
- 生成問題は唯一解チェック済み
- 3x3 ブロックを太線で区切って表示
- 初期値（given）とユーザー入力（user）を色分け
- 初期値セルは編集不可
- iPad Safari では安定表示を優先し、Solve の `solve-no-scroll` モバイル固定レイアウトを適用しない
- 入力形式が不正な場合はエラー表示し、最後の有効盤面を維持（詳細は「入力テキスト形式」参照）

## タップハイライト設定

- モバイルのタップフィードバックは UA 既定表示を透明化し、アプリ側の inset ハイライトで描画します。
- 強度は `src/styles/tokens.css` の `--tap-feedback-overlay` で制御し、既定値は `--tap-feedback-overlay-soft`（見やすさ重視の青）です。
- 実行時に `document.documentElement.dataset.tapHighlight = "off"` で無効化、`"strong"` で強調表示へ切り替わります。

## 既定パズルの差し替え運用

- 既定問題は `public/puzzles/default.txt` から読み込みます。差し替える場合はこのファイルを更新してください。
- 読み込みはアプリ起動時に行われ、保存済みのゲームデータがない場合に初期盤面へ反映されます。
- 保存済みデータ（`localStorage`）がある場合はそちらが優先されるため、差し替え内容がすぐ表示されないことがあります。
- 反映確認時は、UI の保存データ削除操作（ゲームデータのリセット/全消去）を実行してから再読み込みしてください。
- `public/puzzles/default.txt` の読み込みに失敗した場合は、アプリ内の埋め込みフォールバック問題が使われます。

## 入力テキスト形式

この仕様は `src/lib/sudokuParser.ts` の実装に準拠します。

### 受け付ける形式

- 数独データ行は **ちょうど9行** 必要です
- 各データ行には、セルとして解釈される文字（`1-9` または `.`）が **ちょうど9個** 必要です
- `.` は空マスとして扱います
- `0` は不正です
- データ行で許可される文字は次のみです  
  `1-9`, `.`, 空白, `|`, `+`, `-`
- 罫線行（例: `------+-------+------`）や空行は入力に含めても構いませんが、データ行としては数えません

### 形式エラー時の挙動

- エラーメッセージを表示します
- 盤面は更新せず、最後に成功した有効盤面を維持します

### 有効な入力例

```txt
5 3 . | . 7 . | . . .
6 . . | 1 9 5 | . . .
. 9 8 | . . . | . 6 .
------+-------+------
8 . . | . 6 . | . . 3
4 . . | 8 . 3 | . . 1
7 . . | . 2 . | . . 6
------+-------+------
. 6 . | . . . | 2 8 .
. . . | 4 1 9 | . . 5
. . . | . 8 . | . 7 9
```

### 無効な入力例

1. 行数不足（データ行が9未満）
2. どこかの行でセル数不足/超過（`1-9` と `.` の個数が9でない）
3. 不正文字を含む（例: `a`, `@`）
4. `0` を含む

## テスト

```bash
npm run test
```
