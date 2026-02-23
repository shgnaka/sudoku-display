import type { ReactNode } from "react";
import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { clearStorage } from "../../test-utils/browserMocks";
import type { PersistedGameState } from "../../lib/gameStorage";
import { DEFAULT_PUZZLE_FALLBACK_TEXT } from "../../lib/defaultPuzzle";

const {
  loadGameStateMock,
  saveGameStateMock,
  clearGameStateMock,
  loadInkStateMock,
  saveInkStateMock,
  clearInkStateMock,
  generateSudokuMock,
  loadDefaultPuzzleTextMock
} = vi.hoisted(() => ({
  loadGameStateMock: vi.fn(),
  saveGameStateMock: vi.fn(),
  clearGameStateMock: vi.fn(),
  loadInkStateMock: vi.fn(),
  saveInkStateMock: vi.fn(),
  clearInkStateMock: vi.fn(),
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
