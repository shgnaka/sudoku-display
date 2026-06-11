import type { Board, CellData, CellOrigin } from "../types/sudoku";
import { STORAGE_KEYS } from "../constants/storageKeys";
import { SUDOKU_MAX_VALUE, SUDOKU_MIN_VALUE, SUDOKU_SIZE } from "../constants/sudokuDomain";

const STORAGE_KEY = STORAGE_KEYS.game;

export interface PersistedGameState {
  attemptId?: string;
  rawInput: string;
  board: Board;
}

const ALLOWED_ORIGINS: CellOrigin[] = ["given", "user", "empty"];

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isValidCell(cell: unknown): cell is CellData {
  if (!isObject(cell)) {
    return false;
  }

  const origin = cell.origin;
  const value = cell.value;

  if (typeof origin !== "string" || !ALLOWED_ORIGINS.includes(origin as CellOrigin)) {
    return false;
  }

  const hasValidNumericValue =
    typeof value === "number" &&
    Number.isInteger(value) &&
    value >= SUDOKU_MIN_VALUE &&
    value <= SUDOKU_MAX_VALUE;

  if (origin === "empty") {
    return value === null;
  }

  return hasValidNumericValue;
}

function isValidBoard(board: unknown): board is Board {
  if (!Array.isArray(board) || board.length !== SUDOKU_SIZE) {
    return false;
  }

  for (const row of board) {
    if (!Array.isArray(row) || row.length !== SUDOKU_SIZE) {
      return false;
    }

    for (const cell of row) {
      if (!isValidCell(cell)) {
        return false;
      }
    }
  }

  return true;
}

export function loadGameState(): PersistedGameState | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw);
    if (!isObject(parsed)) {
      return null;
    }

    if (typeof parsed.rawInput !== "string" || !isValidBoard(parsed.board)) {
      return null;
    }

    return {
      ...(typeof parsed.attemptId === "string" ? { attemptId: parsed.attemptId } : {}),
      rawInput: parsed.rawInput,
      board: parsed.board
    };
  } catch {
    return null;
  }
}

export function saveGameState(state: PersistedGameState): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore storage failures to keep app usable.
  }
}

export function clearGameState(): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore storage failures.
  }
}
