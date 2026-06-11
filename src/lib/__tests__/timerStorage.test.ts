import { beforeEach, describe, expect, it } from "vitest";
import { clearStorage } from "../../test-utils/browserMocks";
import {
  clearPuzzleTimers,
  loadPuzzleTimer,
  removePuzzleTimer,
  savePuzzleTimer
} from "../timerStorage";

describe("timerStorage", () => {
  beforeEach(() => {
    clearStorage();
  });

  it("stores timers independently for each puzzle", () => {
    savePuzzleTimer("first", { elapsedMs: 12_000, status: "paused", startedAt: null });
    savePuzzleTimer("second", { elapsedMs: 3_000, status: "running", startedAt: 100 });

    expect(loadPuzzleTimer("first")).toEqual({
      elapsedMs: 12_000,
      status: "paused",
      startedAt: null
    });
    expect(loadPuzzleTimer("second")).toEqual({
      elapsedMs: 3_000,
      status: "running",
      startedAt: 100
    });
  });

  it("removes only the selected puzzle timer", () => {
    savePuzzleTimer("first", { elapsedMs: 12_000, status: "paused", startedAt: null });
    savePuzzleTimer("second", { elapsedMs: 3_000, status: "running", startedAt: 100 });

    removePuzzleTimer("first");

    expect(loadPuzzleTimer("first")).toBeNull();
    expect(loadPuzzleTimer("second")).not.toBeNull();
  });

  it("ignores malformed storage and clears all timers", () => {
    window.localStorage.setItem("sudoku-display:timers:v1", "{broken}");
    expect(loadPuzzleTimer("first")).toBeNull();

    savePuzzleTimer("first", { elapsedMs: 1_000, status: "completed", startedAt: null });
    clearPuzzleTimers();
    expect(loadPuzzleTimer("first")).toBeNull();
  });
});
