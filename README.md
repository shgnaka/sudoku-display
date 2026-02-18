# sudoku-display

数独のテキスト形式を見やすい 9x9 グリッドで表示し、空マスを編集できる Web アプリです。

## セットアップ

```bash
npm install
npm run dev
```

## 公開URL

- https://shgnaka.github.io/sudoku-display/

## GitHub Pages 自動デプロイ

1. GitHub の対象リポジトリで `Settings > Pages` を開く
2. `Source` を `GitHub Actions` に設定する
3. `main` ブランチへ push すると `.github/workflows/deploy-pages.yml` が実行される
4. 成功後、上記URLで公開内容を確認する

## 主な仕様

- テキスト入力を自動パースして即時反映
- 3x3 ブロックを太線で区切って表示
- 初期値（given）とユーザー入力（user）を色分け
- 初期値セルは編集不可
- 入力形式が不正な場合はエラー表示し、最後の有効盤面を維持

## テスト

```bash
npm run test
```
