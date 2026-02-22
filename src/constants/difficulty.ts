export const SUDOKU_DIFFICULTIES = ["easy", "medium", "hard"] as const;

export type SudokuDifficulty = (typeof SUDOKU_DIFFICULTIES)[number];

export const DEFAULT_SUDOKU_DIFFICULTY: SudokuDifficulty = "medium";
