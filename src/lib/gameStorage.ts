import type { Board, CellData, CellOrigin } from "../types/sudoku";
import { STORAGE_KEYS } from "../constants/storageKeys";

const STORAGE_KEY = STORAGE_KEYS.game;

export interface PersistedGameState {
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

  if (value === null) {
    return true;
  }

  return typeof value === "number" && Number.isInteger(value) && value >= 1 && value <= 9;
}

function isValidBoard(board: unknown): board is Board {
  if (!Array.isArray(board) || board.length !== 9) {
    return false;
  }

  for (const row of board) {
    if (!Array.isArray(row) || row.length !== 9) {
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
