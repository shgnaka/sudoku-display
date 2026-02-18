import type { Board, CellData } from "../types/sudoku";

export type ParseResult =
  | { ok: true; board: Board }
  | { ok: false; error: string };

const CELL_TOKEN_RE = /[1-9.]/g;
const ALLOWED_LINE_RE = /^[1-9.\s|+\-]+$/;

function toCellData(token: string): CellData {
  if (token === ".") {
    return { value: null, origin: "empty" };
  }

  return { value: Number(token), origin: "given" };
}

export function parseSudokuText(input: string): ParseResult {
  const rawLines = input
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  const candidateLines = rawLines.filter((line) => /[1-9.]/.test(line));

  if (candidateLines.length !== 9) {
    return {
      ok: false,
      error: `数独データ行は9行必要です（現在: ${candidateLines.length}行）。`
    };
  }

  const board: Board = [];

  for (let rowIndex = 0; rowIndex < candidateLines.length; rowIndex += 1) {
    const line = candidateLines[rowIndex];

    if (!ALLOWED_LINE_RE.test(line)) {
      return {
        ok: false,
        error: `${rowIndex + 1}行目に不正な文字が含まれています。`
      };
    }

    const tokens = line.match(CELL_TOKEN_RE) ?? [];

    if (tokens.length !== 9) {
      return {
        ok: false,
        error: `${rowIndex + 1}行目のセル数が9ではありません（現在: ${tokens.length}）。`
      };
    }

    const hasInvalidDigit = /0/.test(line);
    if (hasInvalidDigit) {
      return {
        ok: false,
        error: `${rowIndex + 1}行目に不正な数字 0 が含まれています。`
      };
    }

    board.push(tokens.map(toCellData));
  }

  return { ok: true, board };
}
