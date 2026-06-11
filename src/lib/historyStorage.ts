import { SUDOKU_DIFFICULTIES } from "../constants/difficulty";
import { STORAGE_KEYS } from "../constants/storageKeys";
import { SUDOKU_MAX_VALUE, SUDOKU_MIN_VALUE, SUDOKU_SIZE } from "../constants/sudokuDomain";
import { isSolvedBoard } from "./sudokuModel";
import { parseSudokuText } from "./sudokuParser";
import type { SudokuDifficulty } from "../constants/difficulty";
import type { Board, CellData, CellOrigin } from "../types/sudoku";

const STORAGE_KEY = STORAGE_KEYS.history;
const ALLOWED_ORIGINS: CellOrigin[] = ["given", "user", "empty"];
const DIFFICULTY_SET = new Set<string>(SUDOKU_DIFFICULTIES);

export const HISTORY_LIMIT = 50;

export interface SolvedPuzzleHistoryEntry {
  attemptId: string;
  puzzleId: string;
  puzzle: string;
  generatedAt: string;
  difficulty?: SudokuDifficulty;
  completedBoard?: Board;
  completedAt?: string;
  elapsedMs?: number;
}

export interface SolvedPuzzleRecord {
  attemptId: string;
  puzzle: string;
  completedBoard: Board;
  completedAt: string;
  elapsedMs: number;
  difficulty?: SudokuDifficulty;
}

export interface GeneratedPuzzleRecord {
  attemptId: string;
  puzzle: string;
  generatedAt: string;
  difficulty?: SudokuDifficulty;
}

export interface CompletedPuzzleRecord {
  attemptId: string;
  puzzle: string;
  completedBoard: Board;
  completedAt: string;
  elapsedMs: number;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isValidCell(value: unknown): value is CellData {
  if (!isObject(value)) {
    return false;
  }

  const origin = value.origin;
  const cellValue = value.value;
  if (typeof origin !== "string" || !ALLOWED_ORIGINS.includes(origin as CellOrigin)) {
    return false;
  }

  if (
    typeof cellValue !== "number" ||
    !Number.isInteger(cellValue) ||
    cellValue < SUDOKU_MIN_VALUE ||
    cellValue > SUDOKU_MAX_VALUE
  ) {
    return false;
  }

  return origin !== "empty";
}

function isValidCompletedBoard(value: unknown): value is Board {
  if (!Array.isArray(value) || value.length !== SUDOKU_SIZE) {
    return false;
  }

  const board = value as unknown[][];
  if (
    board.some(
      (row) => !Array.isArray(row) || row.length !== SUDOKU_SIZE || row.some((cell) => !isValidCell(cell))
    )
  ) {
    return false;
  }

  return isSolvedBoard(value as Board);
}

function isValidIsoDate(value: unknown): value is string {
  return typeof value === "string" && Number.isFinite(Date.parse(value));
}

function isValidElapsedMs(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}

function isValidDifficulty(value: unknown): value is SudokuDifficulty {
  return typeof value === "string" && DIFFICULTY_SET.has(value);
}

function getPuzzleId(puzzle: string): string | null {
  const parsed = parseSudokuText(puzzle);
  if (!parsed.ok) {
    return null;
  }

  return parsed.board
    .flat()
    .map((cell) => cell.value ?? 0)
    .join("");
}

function normalizeEntry(value: unknown): SolvedPuzzleHistoryEntry | null {
  if (!isObject(value)) {
    return null;
  }

  const puzzleId = typeof value.puzzle === "string" ? getPuzzleId(value.puzzle) : null;
  const generatedAt = isValidIsoDate(value.generatedAt)
    ? value.generatedAt
    : isValidIsoDate(value.completedAt)
      ? value.completedAt
      : null;
  const hasCompletedAt = value.completedAt !== undefined;
  const hasCompletedBoard = value.completedBoard !== undefined;

  if (
    (typeof value.attemptId !== "string" && typeof value.id !== "string") ||
    (typeof value.attemptId === "string" && value.attemptId.length === 0) ||
    typeof value.puzzle !== "string" ||
    value.puzzle.length === 0 ||
    puzzleId === null ||
    (value.puzzleId !== undefined && value.puzzleId !== puzzleId) ||
    (value.attemptId === undefined && value.id !== puzzleId) ||
    generatedAt === null ||
    hasCompletedAt !== hasCompletedBoard ||
    (hasCompletedAt && (!isValidIsoDate(value.completedAt) || !isValidCompletedBoard(value.completedBoard))) ||
    (value.elapsedMs !== undefined && (!hasCompletedAt || !isValidElapsedMs(value.elapsedMs)))
  ) {
    return null;
  }

  if (value.difficulty !== undefined && !isValidDifficulty(value.difficulty)) {
    return null;
  }

  return {
    attemptId: typeof value.attemptId === "string" ? value.attemptId : (value.id as string),
    puzzleId,
    puzzle: value.puzzle,
    generatedAt,
    ...(value.difficulty === undefined ? {} : { difficulty: value.difficulty }),
    ...(hasCompletedAt
      ? {
          completedAt: value.completedAt as string,
          completedBoard: value.completedBoard as Board,
          ...(value.elapsedMs === undefined ? {} : { elapsedMs: value.elapsedMs as number })
        }
      : {})
  };
}

export function loadSolvedPuzzleHistory(): SolvedPuzzleHistoryEntry[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .map(normalizeEntry)
      .filter((entry): entry is SolvedPuzzleHistoryEntry => entry !== null)
      .sort((left, right) => Date.parse(right.generatedAt) - Date.parse(left.generatedAt))
      .slice(0, HISTORY_LIMIT);
  } catch {
    return [];
  }
}

export function recordSolvedPuzzle(record: SolvedPuzzleRecord): void {
  if (typeof window === "undefined") {
    return;
  }

  const puzzleId = getPuzzleId(record.puzzle);
  if (!puzzleId || !record.attemptId) {
    return;
  }

  const entry: SolvedPuzzleHistoryEntry = {
    attemptId: record.attemptId,
    puzzleId,
    puzzle: record.puzzle,
    generatedAt: record.completedAt,
    completedBoard: record.completedBoard,
    completedAt: record.completedAt,
    elapsedMs: record.elapsedMs,
    ...(record.difficulty ? { difficulty: record.difficulty } : {})
  };

  if (!normalizeEntry(entry)) {
    return;
  }

  const current = loadSolvedPuzzleHistory();
  if (current.some((item) => item.attemptId === entry.attemptId)) {
    return;
  }

  try {
    const next = [entry, ...current]
      .sort((left, right) => Date.parse(right.generatedAt) - Date.parse(left.generatedAt))
      .slice(0, HISTORY_LIMIT);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Ignore storage failures to keep app usable.
  }
}

export function recordGeneratedPuzzle(record: GeneratedPuzzleRecord): void {
  if (typeof window === "undefined") {
    return;
  }

  const puzzleId = getPuzzleId(record.puzzle);
  if (
    !record.attemptId ||
    !puzzleId ||
    !isValidIsoDate(record.generatedAt) ||
    (record.difficulty !== undefined && !isValidDifficulty(record.difficulty))
  ) {
    return;
  }

  const current = loadSolvedPuzzleHistory();
  if (current.some((entry) => entry.attemptId === record.attemptId)) {
    return;
  }

  const entry: SolvedPuzzleHistoryEntry = {
    attemptId: record.attemptId,
    puzzleId,
    puzzle: record.puzzle,
    generatedAt: record.generatedAt,
    ...(record.difficulty ? { difficulty: record.difficulty } : {})
  };

  try {
    const next = [entry, ...current]
      .sort((left, right) => Date.parse(right.generatedAt) - Date.parse(left.generatedAt))
      .slice(0, HISTORY_LIMIT);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Ignore storage failures to keep app usable.
  }
}

export function completePuzzleHistory(record: CompletedPuzzleRecord): boolean {
  if (
    typeof window === "undefined" ||
    !isValidIsoDate(record.completedAt) ||
    !isValidCompletedBoard(record.completedBoard) ||
    !isValidElapsedMs(record.elapsedMs)
  ) {
    return false;
  }

  const puzzleId = getPuzzleId(record.puzzle);
  if (!puzzleId || !record.attemptId) {
    return false;
  }

  const current = loadSolvedPuzzleHistory();
  const existingIndex = current.findIndex(
    (entry) => entry.attemptId === record.attemptId && entry.puzzleId === puzzleId
  );
  if (existingIndex < 0 || current[existingIndex].completedAt) {
    return false;
  }

  const next = current.map((entry, index) =>
    index === existingIndex
      ? {
          ...entry,
          completedBoard: record.completedBoard,
          completedAt: record.completedAt,
          elapsedMs: record.elapsedMs
        }
      : entry
  );

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    return true;
  } catch {
    // Ignore storage failures to keep app usable.
    return false;
  }
}

export function clearSolvedPuzzleHistory(): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore storage failures.
  }
}
