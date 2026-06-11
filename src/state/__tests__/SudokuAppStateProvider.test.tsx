import type { ReactNode } from "react";
import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { clearStorage } from "../../test-utils/browserMocks";
import type { PersistedGameState } from "../../lib/gameStorage";
import type { SolvedPuzzleRecord } from "../../lib/historyStorage";
import { DEFAULT_PUZZLE_FALLBACK_TEXT } from "../../lib/defaultPuzzle";
import {
  createNearlySolvedBoardFixture,
  createSolvedBoardFixture,
  createSolvedPuzzleTextFixture
} from "../../test-utils/storageFixtures";

const {
  loadGameStateMock,
  saveGameStateMock,
  clearGameStateMock,
  loadInkStateMock,
  saveInkStateMock,
  clearInkStateMock,
  recordGeneratedPuzzleMock,
  completePuzzleHistoryMock,
  recordSolvedPuzzleMock,
  clearSolvedPuzzleHistoryMock,
  generateSudokuMock,
  loadDefaultPuzzleTextMock
} = vi.hoisted(() => ({
  loadGameStateMock: vi.fn(),
  saveGameStateMock: vi.fn(),
  clearGameStateMock: vi.fn(),
  loadInkStateMock: vi.fn(),
  saveInkStateMock: vi.fn(),
  clearInkStateMock: vi.fn(),
  recordGeneratedPuzzleMock: vi.fn(),
  completePuzzleHistoryMock: vi.fn(),
  recordSolvedPuzzleMock: vi.fn(),
  clearSolvedPuzzleHistoryMock: vi.fn(),
  generateSudokuMock: vi.fn(),
  loadDefaultPuzzleTextMock: vi.fn()
}));

vi.mock("../../lib/gameStorage", async () => {
  const actual = await vi.importActual<typeof import("../../lib/gameStorage")>("../../lib/gameStorage");
  return {
    ...actual,
    loadGameState: loadGameStateMock,
    saveGameState: saveGameStateMock,
    clearGameState: clearGameStateMock
  };
});

vi.mock("../../lib/inkStorage", async () => {
  const actual = await vi.importActual<typeof import("../../lib/inkStorage")>("../../lib/inkStorage");
  return {
    ...actual,
    loadInkState: loadInkStateMock,
    saveInkState: saveInkStateMock,
    clearInkState: clearInkStateMock
  };
});

vi.mock("../../lib/historyStorage", () => ({
  recordGeneratedPuzzle: recordGeneratedPuzzleMock,
  completePuzzleHistory: completePuzzleHistoryMock,
  recordSolvedPuzzle: recordSolvedPuzzleMock,
  clearSolvedPuzzleHistory: clearSolvedPuzzleHistoryMock
}));

vi.mock("../../wasm/sudokuGenerator", () => ({
  generateSudoku: generateSudokuMock
}));

vi.mock("../../lib/defaultPuzzle", async () => {
  const actual = await vi.importActual<typeof import("../../lib/defaultPuzzle")>("../../lib/defaultPuzzle");
  return {
    ...actual,
    loadDefaultPuzzleText: loadDefaultPuzzleTextMock
  };
});

import { SudokuAppStateProvider, useSudokuAppState } from "../SudokuAppStateProvider";

function wrapper({ children }: { children: ReactNode }): JSX.Element {
  return <SudokuAppStateProvider>{children}</SudokuAppStateProvider>;
}

const validBoardLine = "5 3 . | . 7 . | . . .";
const validPuzzleText = `${validBoardLine}\n6 . . | 1 9 5 | . . .\n. 9 8 | . . . | . 6 .\n8 . . | . 6 . | . . 3\n4 . . | 8 . 3 | . . 1\n7 . . | . 2 . | . . 6\n. 6 . | . . . | 2 8 .\n. . . | 4 1 9 | . . 5\n. . . | . 8 . | . 7 9`;

function createPersistedState(): PersistedGameState {
  const board = Array.from({ length: 9 }, (_, row) =>
    Array.from({ length: 9 }, (_, col) => {
      if (row === 0 && col === 0) {
        return { value: 5, origin: "given" as const };
      }

      if (row === 0 && col === 2) {
        return { value: 4, origin: "user" as const };
      }

      return { value: null, origin: "empty" as const };
    })
  );

  return {
    rawInput: validPuzzleText,
    board
  };
}

describe("SudokuAppStateProvider mode machine", () => {
  beforeEach(() => {
    clearStorage();
    loadGameStateMock.mockReset();
    saveGameStateMock.mockReset();
    clearGameStateMock.mockReset();
    loadInkStateMock.mockReset();
    saveInkStateMock.mockReset();
    clearInkStateMock.mockReset();
    recordGeneratedPuzzleMock.mockReset();
    completePuzzleHistoryMock.mockReset();
    completePuzzleHistoryMock.mockReturnValue(false);
    recordSolvedPuzzleMock.mockReset();
    clearSolvedPuzzleHistoryMock.mockReset();
    generateSudokuMock.mockReset();
    loadDefaultPuzzleTextMock.mockReset();

    loadGameStateMock.mockReturnValue(null);
    loadInkStateMock.mockReturnValue({
      "0-0": [],
      "0-1": [],
      "0-2": [],
      "1-0": [],
      "1-1": [],
      "1-2": [],
      "2-0": [],
      "2-1": [],
      "2-2": []
    });
    loadDefaultPuzzleTextMock.mockResolvedValue(DEFAULT_PUZZLE_FALLBACK_TEXT);
  });

  it("throws outside provider", () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    expect(() => renderHook(() => useSudokuAppState())).toThrow(/must be used within SudokuAppStateProvider/);
    consoleErrorSpy.mockRestore();
  });

  it("toggles ink mode between normal and ink", () => {
    const { result } = renderHook(() => useSudokuAppState(), { wrapper });

    expect(result.current.isInkMode).toBe(false);
    expect(result.current.isReviewMode).toBe(false);

    act(() => {
      result.current.toggleInkMode();
    });

    expect(result.current.isInkMode).toBe(true);
    expect(result.current.isReviewMode).toBe(false);

    act(() => {
      result.current.toggleInkMode();
    });

    expect(result.current.isInkMode).toBe(false);
    expect(result.current.isReviewMode).toBe(false);
  });

  it("switches to review mode and clears ink mode", () => {
    const { result } = renderHook(() => useSudokuAppState(), { wrapper });

    act(() => {
      result.current.toggleInkMode();
    });
    expect(result.current.isInkMode).toBe(true);

    act(() => {
      result.current.toggleReviewMode();
    });

    expect(result.current.isReviewMode).toBe(true);
    expect(result.current.isInkMode).toBe(false);
  });

  it("keeps review mode when ink toggle is requested during review", () => {
    const { result } = renderHook(() => useSudokuAppState(), { wrapper });

    act(() => {
      result.current.toggleReviewMode();
    });
    expect(result.current.isReviewMode).toBe(true);

    act(() => {
      result.current.toggleInkMode();
    });

    expect(result.current.isReviewMode).toBe(true);
    expect(result.current.isInkMode).toBe(false);
  });

  it("sets error message when raw input is invalid", () => {
    const { result } = renderHook(() => useSudokuAppState(), { wrapper });

    act(() => {
      result.current.setRawInput("1 2 3");
    });

    expect(result.current.errorMessage).toContain("数独データ行は9行必要");
  });

  it("handles generate puzzle success", async () => {
    const puzzle = new Uint8Array(81);
    puzzle[0] = 1;
    puzzle[1] = 2;
    puzzle[2] = 3;

    generateSudokuMock.mockResolvedValue({
      puzzle,
      solution: puzzle,
      clues: 9,
      difficulty: "hard",
      seed: 1n
    });

    const { result } = renderHook(() => useSudokuAppState(), { wrapper });

    await act(async () => {
      await result.current.handleGeneratePuzzle();
    });

    expect(generateSudokuMock).toHaveBeenCalledTimes(1);
    expect(result.current.generationError).toBe("");
    expect(result.current.isGenerating).toBe(false);
    expect(clearInkStateMock).toHaveBeenCalled();
    expect(result.current.rawInput).toContain("1 2 3");
  });

  it("handles generate puzzle failure with Error", async () => {
    generateSudokuMock.mockRejectedValue(new Error("generator failed"));

    const { result } = renderHook(() => useSudokuAppState(), { wrapper });

    await act(async () => {
      await result.current.handleGeneratePuzzle();
    });

    expect(result.current.generationError).toBe("generator failed");
    expect(result.current.isGenerating).toBe(false);
  });

  it("handles generate puzzle failure with unknown error", async () => {
    generateSudokuMock.mockRejectedValue("failed");

    const { result } = renderHook(() => useSudokuAppState(), { wrapper });

    await act(async () => {
      await result.current.handleGeneratePuzzle();
    });

    expect(result.current.generationError).toBe("数独の生成に失敗しました。");
    expect(result.current.isGenerating).toBe(false);
  });

  it("clearInkData exits ink mode and clears storage", () => {
    const { result } = renderHook(() => useSudokuAppState(), { wrapper });

    act(() => {
      result.current.toggleInkMode();
    });
    expect(result.current.isInkMode).toBe(true);

    act(() => {
      result.current.clearInkData();
    });

    expect(result.current.isInkMode).toBe(false);
    expect(clearInkStateMock).toHaveBeenCalled();
  });

  it("resetGameData clears review mode and resets board/input", () => {
    const { result } = renderHook(() => useSudokuAppState(), { wrapper });

    act(() => {
      result.current.toggleReviewMode();
      result.current.setRawInput(validPuzzleText);
      result.current.setRawInput("1 2 3");
    });

    expect(result.current.isReviewMode).toBe(true);
    expect(result.current.errorMessage).not.toBe("");

    act(() => {
      result.current.resetGameData();
    });

    expect(result.current.isReviewMode).toBe(false);
    expect(result.current.rawInput).toBe(DEFAULT_PUZZLE_FALLBACK_TEXT);
    expect(result.current.errorMessage).toBe("");
    expect(result.current.generationError).toBe("");
    expect(clearGameStateMock).toHaveBeenCalled();
  });

  it("clearAllStoredData resets modes and grid editing", () => {
    const { result } = renderHook(() => useSudokuAppState(), { wrapper });

    act(() => {
      result.current.toggleInkMode();
      result.current.setIsGridEditing(true);
    });

    expect(result.current.isInkMode).toBe(true);
    expect(result.current.isGridEditing).toBe(true);

    act(() => {
      result.current.clearAllStoredData();
    });

    expect(result.current.isInkMode).toBe(false);
    expect(result.current.isReviewMode).toBe(false);
    expect(result.current.isGridEditing).toBe(false);
    expect(result.current.rawInput).toBe(DEFAULT_PUZZLE_FALLBACK_TEXT);
    expect(clearGameStateMock).toHaveBeenCalled();
    expect(clearInkStateMock).toHaveBeenCalled();
    expect(clearSolvedPuzzleHistoryMock).toHaveBeenCalled();
  });

  it("records history when the board transitions from incomplete to solved", () => {
    const puzzle = createSolvedPuzzleTextFixture({ row: 8, col: 8 });
    loadGameStateMock.mockReturnValue({
      rawInput: puzzle,
      board: createNearlySolvedBoardFixture()
    });

    const { result } = renderHook(() => useSudokuAppState(), { wrapper });

    expect(recordSolvedPuzzleMock).not.toHaveBeenCalled();

    act(() => {
      result.current.handleCellChange(8, 8, 9);
    });

    expect(recordSolvedPuzzleMock).toHaveBeenCalledTimes(1);
    expect(recordSolvedPuzzleMock).toHaveBeenCalledWith({
      attemptId: expect.any(String),
      puzzle,
      completedBoard: createSolvedBoardFixture(),
      completedAt: expect.any(String),
      elapsedMs: expect.any(Number)
    });
    expect(result.current.isTimerCompleted).toBe(true);
    expect(result.current.isReviewMode).toBe(true);

    act(() => {
      result.current.toggleReviewMode();
      result.current.handleCellChange(8, 8, 8);
    });

    expect(result.current.isReviewMode).toBe(true);
    expect(result.current.board[8][8]).toEqual({ value: 9, origin: "user" });
  });

  it("does not record an already solved board restored from storage", () => {
    loadGameStateMock.mockReturnValue({
      rawInput: createSolvedPuzzleTextFixture({ row: 8, col: 8 }),
      board: createSolvedBoardFixture()
    });

    renderHook(() => useSudokuAppState(), { wrapper });

    expect(recordSolvedPuzzleMock).not.toHaveBeenCalled();
  });

  it("does not record when a completed grid is pasted as puzzle input", () => {
    const { result } = renderHook(() => useSudokuAppState(), { wrapper });

    act(() => {
      result.current.setRawInput(createSolvedPuzzleTextFixture());
    });

    expect(recordSolvedPuzzleMock).not.toHaveBeenCalled();
  });

  it("does not record a full board that violates Sudoku rules", () => {
    const board = createNearlySolvedBoardFixture();
    board[8][8] = { value: 8, origin: "user" };
    loadGameStateMock.mockReturnValue({
      rawInput: createSolvedPuzzleTextFixture({ row: 8, col: 8 }),
      board
    });

    renderHook(() => useSudokuAppState(), { wrapper });

    expect(recordSolvedPuzzleMock).not.toHaveBeenCalled();
  });

  it("keeps a fully filled incorrect board incomplete after the last user edit", () => {
    const puzzle = createSolvedPuzzleTextFixture({ row: 8, col: 8 });
    loadGameStateMock.mockReturnValue({
      rawInput: puzzle,
      board: createNearlySolvedBoardFixture()
    });

    const { result } = renderHook(() => useSudokuAppState(), { wrapper });

    act(() => {
      result.current.handleCellChange(8, 8, 8);
    });

    expect(result.current.board.flat().every((cell) => cell.value !== null)).toBe(true);
    expect(completePuzzleHistoryMock).not.toHaveBeenCalled();
    expect(recordSolvedPuzzleMock).not.toHaveBeenCalled();
    expect(result.current.isTimerCompleted).toBe(false);
  });

  it("does not record repeatedly while the board remains solved", () => {
    const puzzle = createSolvedPuzzleTextFixture({ row: 8, col: 8 });
    loadGameStateMock.mockReturnValue({
      rawInput: puzzle,
      board: createNearlySolvedBoardFixture()
    });

    const { result } = renderHook(() => useSudokuAppState(), { wrapper });

    act(() => {
      result.current.handleCellChange(8, 8, 9);
      result.current.handleCellChange(8, 8, 9);
    });

    expect(recordSolvedPuzzleMock).toHaveBeenCalledTimes(1);
  });

  it("loads an incomplete history entry as an editable puzzle", () => {
    const { result } = renderHook(() => useSudokuAppState(), { wrapper });
    const puzzle = createSolvedPuzzleTextFixture({ row: 8, col: 8 });

    act(() => {
      result.current.loadHistoryEntry({
        attemptId: "incomplete",
        puzzleId: "puzzle-id",
        puzzle,
        generatedAt: "2026-06-10T10:00:00.000Z",
        difficulty: "hard"
      });
    });

    expect(result.current.rawInput).toBe(puzzle);
    expect(result.current.board[8][8]).toEqual({ value: null, origin: "empty" });
    expect(result.current.isReviewMode).toBe(false);
    expect(result.current.isInkMode).toBe(false);
  });

  it("loads a completed history entry in review mode", () => {
    const { result } = renderHook(() => useSudokuAppState(), { wrapper });
    const puzzle = createSolvedPuzzleTextFixture({ row: 8, col: 8 });
    const completedBoard = createSolvedBoardFixture();

    act(() => {
      result.current.loadHistoryEntry({
        attemptId: "completed",
        puzzleId: "puzzle-id",
        puzzle,
        generatedAt: "2026-06-10T10:00:00.000Z",
        completedAt: "2026-06-10T12:00:00.000Z",
        completedBoard,
        difficulty: "hard"
      });
    });

    expect(result.current.rawInput).toBe(puzzle);
    expect(result.current.board).toEqual(completedBoard);
    expect(result.current.isReviewMode).toBe(true);
    expect(result.current.isInkMode).toBe(false);
  });

  it("starts a fresh incomplete attempt from a completed history entry", () => {
    const { result } = renderHook(() => useSudokuAppState(), { wrapper });
    const puzzle = createSolvedPuzzleTextFixture({ row: 8, col: 8 });
    const completedEntry = {
      attemptId: "completed",
      puzzleId: "puzzle-id",
      puzzle,
      generatedAt: "2026-06-10T10:00:00.000Z",
      completedAt: "2026-06-10T12:00:00.000Z",
      completedBoard: createSolvedBoardFixture(),
      elapsedMs: 125_000,
      difficulty: "hard" as const
    };

    act(() => {
      result.current.retryHistoryEntry(completedEntry);
    });

    expect(result.current.board[8][8]).toEqual({ value: null, origin: "empty" });
    expect(result.current.isTimerCompleted).toBe(false);
    expect(result.current.elapsedSeconds).toBe(0);
    expect(result.current.isReviewMode).toBe(false);
    expect(recordGeneratedPuzzleMock).toHaveBeenCalledWith({
      attemptId: expect.any(String),
      puzzle,
      generatedAt: expect.any(String),
      difficulty: "hard"
    });
    expect(recordGeneratedPuzzleMock.mock.calls[0][0].attemptId).not.toBe(completedEntry.attemptId);
  });

  it("records generated puzzle difficulty when that puzzle is solved", async () => {
    const nearlySolved = createNearlySolvedBoardFixture();
    const puzzle = new Uint8Array(nearlySolved.flat().map((cell) => cell.value ?? 0));
    const solution = new Uint8Array(createSolvedBoardFixture().flat().map((cell) => cell.value ?? 0));
    generateSudokuMock.mockResolvedValue({
      puzzle,
      solution,
      clues: 80,
      difficulty: "hard",
      seed: 1n
    });

    const { result } = renderHook(() => useSudokuAppState(), { wrapper });

    await act(async () => {
      await result.current.handleGeneratePuzzle();
    });

    expect(recordGeneratedPuzzleMock).toHaveBeenCalledTimes(1);
    expect(recordGeneratedPuzzleMock).toHaveBeenCalledWith({
      attemptId: expect.any(String),
      puzzle: result.current.rawInput,
      generatedAt: expect.any(String),
      difficulty: "hard"
    });
    expect(completePuzzleHistoryMock).not.toHaveBeenCalled();

    completePuzzleHistoryMock.mockReturnValue(true);
    act(() => {
      result.current.handleCellChange(8, 8, 9);
    });

    expect(recordSolvedPuzzleMock).not.toHaveBeenCalled();
    expect(completePuzzleHistoryMock).toHaveBeenCalledTimes(1);
    const recorded = completePuzzleHistoryMock.mock.calls[0][0] as SolvedPuzzleRecord;
    expect(recorded.puzzle).toBe(result.current.rawInput);
    expect(recorded.completedAt).toEqual(expect.any(String));
    expect(recorded.completedBoard.flat().map((cell) => cell.value)).toEqual(Array.from(solution));
    expect(recorded.completedBoard[0][0].origin).toBe("given");
    expect(recorded.completedBoard[8][8].origin).toBe("user");
  });

  it("clear active block removes only the selected block strokes", async () => {
    loadInkStateMock.mockReturnValue({
      "0-0": [
        {
          points: [{ x: 0.2, y: 0.2 }],
          color: "#111111",
          width: 2,
          ts: 1
        }
      ],
      "0-1": [
        {
          points: [{ x: 0.3, y: 0.3 }],
          color: "#111111",
          width: 2,
          ts: 2
        }
      ],
      "0-2": [],
      "1-0": [],
      "1-1": [],
      "1-2": [],
      "2-0": [],
      "2-1": [],
      "2-2": []
    });

    const { result } = renderHook(() => useSudokuAppState(), { wrapper });

    await waitFor(() => {
      expect(result.current.inkState["0-0"]).toHaveLength(1);
    });

    act(() => {
      result.current.setActiveBlockId("0-0");
      result.current.handleClearActiveBlock();
    });

    expect(result.current.inkState["0-0"]).toEqual([]);
    expect(result.current.inkState["0-1"]).toHaveLength(1);
  });

  it("keeps persisted board until first valid raw input parse", () => {
    const persisted = createPersistedState();
    loadGameStateMock.mockReturnValue(persisted);

    const { result } = renderHook(() => useSudokuAppState(), { wrapper });

    expect(result.current.board[0][2]).toEqual({ value: 4, origin: "user" });

    act(() => {
      result.current.setRawInput(validPuzzleText);
    });

    expect(result.current.board[0][2]).toEqual({ value: 4, origin: "user" });

    act(() => {
      result.current.setRawInput(validPuzzleText.replace("5 3 .", "9 3 ."));
    });

    expect(result.current.board[0][0]).toEqual({ value: 9, origin: "given" });
  });

  it("updates board by user cell change", () => {
    const { result } = renderHook(() => useSudokuAppState(), { wrapper });

    act(() => {
      result.current.handleCellChange(0, 2, 4);
    });

    expect(result.current.board[0][2]).toEqual({ value: 4, origin: "user" });
  });

  it("commits stroke and clears all ink", () => {
    const { result } = renderHook(() => useSudokuAppState(), { wrapper });

    act(() => {
      result.current.handleCommitStroke("0-0", {
        points: [{ x: 0.2, y: 0.2 }],
        color: "#111111",
        width: 2,
        ts: 10
      });
    });

    expect(result.current.inkState["0-0"]).toHaveLength(1);

    act(() => {
      result.current.handleClearAllInk();
    });

    expect(result.current.inkState["0-0"]).toEqual([]);
    expect(clearInkStateMock).toHaveBeenCalled();
  });

  it("loads default puzzle text outside test mode and falls back to empty board on invalid text", async () => {
    vi.stubEnv("MODE", "development");
    loadDefaultPuzzleTextMock.mockResolvedValue("invalid");

    const { result } = renderHook(() => useSudokuAppState(), { wrapper });

    await waitFor(() => {
      expect(loadDefaultPuzzleTextMock).toHaveBeenCalledTimes(1);
    });

    act(() => {
      result.current.resetGameData();
    });

    const emptyCellCount = result.current.board.flat().filter((cell) => cell.origin === "empty").length;
    expect(emptyCellCount).toBe(81);
    vi.unstubAllEnvs();
  });
});
