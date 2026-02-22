export const STORAGE_MESSAGES = {
  title: "保存データ管理",
  hint: "ローカルストレージに保存されている盤面と手書きメモを削除できます。",
  actions: {
    clearGame: "盤面データを初期化",
    clearInk: "手書きメモを削除",
    clearAll: "すべて削除"
  },
  confirm: {
    clearGame: "盤面データを初期化します。よろしいですか？",
    clearInk: "手書きメモを削除します。よろしいですか？",
    clearAll: "保存データをすべて削除します。よろしいですか？"
  }
} as const;
