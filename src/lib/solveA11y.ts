import type { CellData } from "../types/sudoku";

function getCellStateLabel(cell: CellData): string {
  if (cell.origin === "given") {
    return "初期値";
  }

  if (cell.origin === "user") {
    return "ユーザー入力";
  }

  return "空";
}

function getEditabilityLabel(cell: CellData, disabled: boolean): string {
  if (cell.origin === "given") {
    return "編集不可（初期値）";
  }

  if (disabled) {
    return "編集不可（確認モード）";
  }

  return "編集可能";
}

export function buildCellAriaLabel(params: {
  cell: CellData;
  row: number;
  col: number;
  disabled: boolean;
}): string {
  const { cell, row, col, disabled } = params;
  return `${row + 1}行${col + 1}列、${getCellStateLabel(cell)}、${getEditabilityLabel(cell, disabled)}`;
}

export function buildSelectionAnnouncement(row: number, col: number): string {
  return `${row + 1}行${col + 1}列を選択しました。`;
}

export function buildSelectionClearedAnnouncement(): string {
  return "セル選択を解除しました。";
}

export function buildValueChangeAnnouncement(params: { row: number; col: number; value: number | null }): string {
  const { row, col, value } = params;
  if (value === null) {
    return `${row + 1}行${col + 1}列を空にしました。`;
  }

  return `${row + 1}行${col + 1}列を ${value} にしました。`;
}
