import { act, fireEvent, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { saveGameState } from "../../lib/gameStorage";
import { loadSolvedPuzzleHistory } from "../../lib/historyStorage";
import { loadPuzzleTimer } from "../../lib/timerStorage";
import { getPuzzleId } from "../../lib/sudokuModel";
import {
  createNearlySolvedBoardFixture,
  createSolvedPuzzleTextFixture
} from "../../test-utils/storageFixtures";
import { cellLabel, clickNav, renderApp, resetAppTestState } from "../../test-utils/renderApp";

const LONG_PRESS_MS = 500;

function openMobileSolveTools(): HTMLElement {
  const solveTab = screen.getByRole("button", { name: "解く" });

  fireEvent.pointerDown(solveTab, { button: 0, pointerId: 1 });
  act(() => {
    vi.advanceTimersByTime(LONG_PRESS_MS);
  });
  fireEvent.pointerUp(solveTab, { button: 0, pointerId: 1 });

  return screen.getByRole("dialog", { name: "解答ツール" });
}

function seedNearlySolvedGame(): void {
  saveGameState({
    rawInput: createSolvedPuzzleTextFixture({ row: 8, col: 8 }),
    board: createNearlySolvedBoardFixture()
  });
}

describe("solve tools contract", () => {
  beforeEach(() => {
    resetAppTestState();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("mobile long press", () => {
    it("opens the solve tools drawer after holding the active solve tab for 500ms", () => {
      renderApp({ isMobile: true, isSheetInput: true });

      const drawer = openMobileSolveTools();

      expect(within(drawer).getByText("経過時間")).toBeInTheDocument();
      expect(within(drawer).getByRole("button", { name: "一時停止" })).toBeInTheDocument();
      expect(within(drawer).getByRole("button", { name: "答え合わせ" })).toBeInTheDocument();
    });

    it("opens the same solve tools drawer on a tablet viewport", () => {
      renderApp({ isMobile: false, isSheetInput: true });
      expect(screen.queryByRole("region", { name: "解答ツール" })).not.toBeInTheDocument();

      const drawer = openMobileSolveTools();

      expect(within(drawer).getByText("経過時間")).toBeInTheDocument();
      expect(screen.getAllByRole("region", { name: "解答ツール" })).toHaveLength(1);
    });

    it("does not open the drawer from a short tap", () => {
      renderApp({ isMobile: true, isSheetInput: true });

      const solveTab = screen.getByRole("button", { name: "解く" });
      fireEvent.pointerDown(solveTab, { button: 0, pointerId: 1 });
      act(() => {
        vi.advanceTimersByTime(LONG_PRESS_MS - 1);
      });
      fireEvent.pointerUp(solveTab, { button: 0, pointerId: 1 });

      expect(screen.queryByRole("dialog", { name: "解答ツール" })).not.toBeInTheDocument();
    });

    it.each([
      ["pointer cancellation", "pointerCancel"],
      ["leaving the button", "pointerLeave"]
    ] as const)("cancels a pending long press after %s", (_label, eventName) => {
      renderApp({ isMobile: true, isSheetInput: true });

      const solveTab = screen.getByRole("button", { name: "解く" });
      fireEvent.pointerDown(solveTab, { button: 0, pointerId: 1 });
      fireEvent[eventName](solveTab, { pointerId: 1 });
      act(() => {
        vi.advanceTimersByTime(LONG_PRESS_MS);
      });

      expect(screen.queryByRole("dialog", { name: "解答ツール" })).not.toBeInTheDocument();
    });

    it("enables long press only while the solve page is active", () => {
      renderApp({ route: "#/manage", isMobile: true, isSheetInput: true });

      const solveTab = screen.getByRole("button", { name: "解く" });
      fireEvent.pointerDown(solveTab, { button: 0, pointerId: 1 });
      act(() => {
        vi.advanceTimersByTime(LONG_PRESS_MS);
      });

      expect(screen.queryByRole("dialog", { name: "解答ツール" })).not.toBeInTheDocument();
      expect(window.location.hash).toBe("#/manage");
    });

    it("keeps ordinary solve-tab navigation available", () => {
      renderApp({ route: "#/manage", isMobile: true, isSheetInput: true });

      clickNav("解く");

      expect(window.location.hash).toBe("#/solve");
      expect(screen.queryByRole("dialog", { name: "解答ツール" })).not.toBeInTheDocument();
    });

    it("closes the drawer with Escape and restores focus to the solve tab", () => {
      renderApp({ isMobile: true, isSheetInput: true });
      openMobileSolveTools();

      fireEvent.keyDown(window, { key: "Escape" });

      expect(screen.queryByRole("dialog", { name: "解答ツール" })).not.toBeInTheDocument();
      expect(screen.getByRole("button", { name: "解く" })).toHaveFocus();
    });
  });

  describe("timer", () => {
    it("shows a persistent desktop timer and advances once per second", () => {
      renderApp();

      const tools = screen.getByRole("region", { name: "解答ツール" });
      expect(within(tools).getByText("00:00")).toBeInTheDocument();

      act(() => {
        vi.advanceTimersByTime(65_000);
      });

      expect(within(tools).getByText("01:05")).toBeInTheDocument();
    });

    it("pauses time, blurs and disables the board, then restores it on resume", () => {
      renderApp({ isMobile: true, isSheetInput: true });
      const drawer = openMobileSolveTools();

      act(() => {
        vi.advanceTimersByTime(10_000);
      });
      expect(within(drawer).getByText("00:10")).toBeInTheDocument();

      fireEvent.click(within(drawer).getByRole("button", { name: "一時停止" }));

      const grid = screen.getByRole("grid", { hidden: true });
      expect(grid).toHaveAttribute("aria-hidden", "true");
      expect(grid).toHaveAttribute("aria-label", "sudoku-grid");
      expect(grid.closest(".board-wrap")).toHaveClass("timer-paused");
      expect(screen.getAllByRole("button", { name: /行.*列/, hidden: true })[0]).toBeDisabled();

      act(() => {
        vi.advanceTimersByTime(20_000);
      });
      expect(within(drawer).getByText("00:10")).toBeInTheDocument();

      fireEvent.click(within(drawer).getByRole("button", { name: "再開" }));

      expect(screen.getByRole("grid", { name: "sudoku-grid" })).not.toHaveAttribute("aria-hidden");
      expect(screen.getByRole("grid", { name: "sudoku-grid" }).closest(".board-wrap")).not.toHaveClass(
        "timer-paused"
      );
    });

    it("restores elapsed time after the app is remounted", () => {
      const firstRender = renderApp();
      act(() => {
        vi.advanceTimersByTime(12_000);
      });
      expect(screen.getByText("00:12")).toBeInTheDocument();

      firstRender.unmount();
      renderApp();

      expect(screen.getByText("00:12")).toBeInTheDocument();
    });

    it("keeps a paused timer stopped across an app remount", () => {
      const firstRender = renderApp();
      act(() => {
        vi.advanceTimersByTime(10_000);
      });
      fireEvent.click(screen.getByRole("button", { name: "一時停止" }));
      firstRender.unmount();

      act(() => {
        vi.advanceTimersByTime(20_000);
      });
      renderApp();

      expect(screen.getByText("00:10")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "再開" })).toBeInTheDocument();
      const grid = screen.getByRole("grid", { hidden: true });
      expect(grid).toHaveAttribute("aria-hidden", "true");
      expect(grid).toHaveAttribute("aria-label", "sudoku-grid");
    });

    it("does not allow answer checking while paused", () => {
      renderApp();

      fireEvent.click(screen.getByRole("button", { name: "一時停止" }));

      expect(screen.getByRole("button", { name: "答え合わせ" })).toBeDisabled();
    });

    it("removes the timer when the puzzle is completed", () => {
      seedNearlySolvedGame();
      renderApp();
      act(() => {
        vi.advanceTimersByTime(10_000);
      });

      fireEvent.change(screen.getByLabelText(cellLabel(9, 9)), { target: { value: "9" } });
      act(() => {
        vi.advanceTimersByTime(20_000);
      });

      const parsedPuzzle = createNearlySolvedBoardFixture();
      expect(screen.queryByRole("region", { name: "解答ツール" })).not.toBeInTheDocument();
      expect(loadPuzzleTimer(getPuzzleId(parsedPuzzle))).toBeNull();
      expect(loadSolvedPuzzleHistory()[0].elapsedMs).toBe(10_000);
    });
  });

  describe("answer checking", () => {
    it("marks only an entered incorrect cell and does not reveal its answer", () => {
      seedNearlySolvedGame();
      renderApp();

      const finalCell = screen.getByLabelText(cellLabel(9, 9));
      fireEvent.change(finalCell, { target: { value: "8" } });
      fireEvent.click(screen.getByRole("button", { name: "答え合わせ" }));

      expect(finalCell).toHaveAttribute("aria-invalid", "true");
      expect(finalCell).toHaveValue("8");
      expect(screen.getByText("1か所、入力を見直してください。")).toBeInTheDocument();
    });

    it("clears a stale incorrect marker as soon as that cell is edited", () => {
      seedNearlySolvedGame();
      renderApp();

      const finalCell = screen.getByLabelText(cellLabel(9, 9));
      fireEvent.change(finalCell, { target: { value: "8" } });
      fireEvent.click(screen.getByRole("button", { name: "答え合わせ" }));
      expect(finalCell).toHaveAttribute("aria-invalid", "true");

      fireEvent.change(finalCell, { target: { value: "9" } });

      expect(finalCell).not.toHaveAttribute("aria-invalid", "true");
      expect(screen.queryByText("1か所、入力を見直してください。")).not.toBeInTheDocument();
    });

    it("does not mark unanswered cells as incorrect", () => {
      seedNearlySolvedGame();
      renderApp();

      const finalCell = screen.getByLabelText(cellLabel(9, 9));
      fireEvent.click(screen.getByRole("button", { name: "答え合わせ" }));

      expect(finalCell).not.toHaveAttribute("aria-invalid", "true");
      expect(screen.getByText("未入力のマスがあります。")).toBeInTheDocument();
    });

    it("completes automatically when the final entered value is correct", () => {
      seedNearlySolvedGame();
      renderApp();

      fireEvent.change(screen.getByLabelText(cellLabel(9, 9)), { target: { value: "9" } });

      expect(screen.queryByRole("region", { name: "解答ツール" })).not.toBeInTheDocument();
      expect(loadSolvedPuzzleHistory()[0].completedAt).toEqual(expect.any(String));
    });
  });
});
