import { beforeEach, describe, expect, it, vi } from "vitest";
import { STORAGE_KEYS } from "../../constants/storageKeys";
import {
  createSolvedBoardFixture,
  createSolvedPuzzleTextFixture
} from "../../test-utils/storageFixtures";
import { clearStorage, seedStorage } from "../../test-utils/browserMocks";
import {
  HISTORY_LIMIT,
  clearSolvedPuzzleHistory,
  completePuzzleHistory,
  loadSolvedPuzzleHistory,
  recordGeneratedPuzzle,
  recordSolvedPuzzle
} from "../historyStorage";

const STORAGE_KEY = STORAGE_KEYS.history;

function withWindowUndefined(run: () => void): void {
  const originalWindow = globalThis.window;
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: undefined
  });

  try {
    run();
  } finally {
    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: originalWindow
    });
  }
}

function createRecord(overrides: Partial<Parameters<typeof recordSolvedPuzzle>[0]> = {}) {
  return {
    attemptId: "attempt-1",
    puzzle: createSolvedPuzzleTextFixture({ row: 8, col: 8 }),
    completedBoard: createSolvedBoardFixture(),
    completedAt: "2026-06-10T12:00:00.000Z",
    elapsedMs: 125_000,
    ...overrides
  };
}

function createGeneratedRecord(overrides: Partial<Parameters<typeof recordGeneratedPuzzle>[0]> = {}) {
  return {
    attemptId: "attempt-1",
    puzzle: createSolvedPuzzleTextFixture({ row: 8, col: 8 }),
    generatedAt: "2026-06-10T10:00:00.000Z",
    difficulty: "hard" as const,
    ...overrides
  };
}

describe("historyStorage", () => {
  beforeEach(() => {
    clearStorage();
  });

  it("returns an empty list when storage is empty or window is unavailable", () => {
    expect(loadSolvedPuzzleHistory()).toEqual([]);

    withWindowUndefined(() => {
      expect(loadSolvedPuzzleHistory()).toEqual([]);
    });
  });

  it("records an entry and loads it newest first", () => {
    recordSolvedPuzzle(createRecord({ completedAt: "2026-06-10T10:00:00.000Z" }));
    recordSolvedPuzzle(
      createRecord({
        attemptId: "attempt-2",
        puzzle: createSolvedPuzzleTextFixture({ row: 0, col: 0 }),
        completedAt: "2026-06-10T11:00:00.000Z",
        difficulty: "hard"
      })
    );

    const history = loadSolvedPuzzleHistory();

    expect(history).toHaveLength(2);
    expect(history.map((entry) => entry.completedAt)).toEqual([
      "2026-06-10T11:00:00.000Z",
      "2026-06-10T10:00:00.000Z"
    ]);
    expect(history[0].difficulty).toBe("hard");
  });

  it("records a generated puzzle immediately as incomplete", () => {
    recordGeneratedPuzzle(createGeneratedRecord());

    const history = loadSolvedPuzzleHistory();

    expect(history).toHaveLength(1);
    expect(history[0]).toMatchObject({
      puzzle: createGeneratedRecord().puzzle,
      generatedAt: "2026-06-10T10:00:00.000Z",
      difficulty: "hard"
    });
    expect(history[0].completedAt).toBeUndefined();
    expect(history[0].completedBoard).toBeUndefined();
  });

  it("updates the generated entry when the same puzzle is completed", () => {
    const generated = createGeneratedRecord();
    recordGeneratedPuzzle(generated);

    completePuzzleHistory({
      attemptId: "attempt-1",
      puzzle: generated.puzzle,
      completedBoard: createSolvedBoardFixture(),
      completedAt: "2026-06-10T12:00:00.000Z",
      elapsedMs: 125_000
    });

    const history = loadSolvedPuzzleHistory();
    expect(history).toHaveLength(1);
    expect(history[0]).toMatchObject({
      generatedAt: generated.generatedAt,
      completedAt: "2026-06-10T12:00:00.000Z",
      elapsedMs: 125_000,
      difficulty: "hard"
    });
    expect(history[0].completedBoard).toEqual(createSolvedBoardFixture());
    expect(history[0].elapsedMs).toBe(125_000);
  });

  it("completes only the selected attempt when the puzzle is the same", () => {
    const first = createGeneratedRecord({ attemptId: "attempt-1" });
    const second = createGeneratedRecord({
      attemptId: "attempt-2",
      generatedAt: "2026-06-10T11:00:00.000Z"
    });
    recordGeneratedPuzzle(first);
    recordGeneratedPuzzle(second);

    completePuzzleHistory({
      attemptId: "attempt-2",
      puzzle: second.puzzle,
      completedBoard: createSolvedBoardFixture(),
      completedAt: "2026-06-10T12:00:00.000Z",
      elapsedMs: 125_000
    });

    const history = loadSolvedPuzzleHistory();
    expect(history.find((entry) => entry.attemptId === "attempt-1")?.completedAt).toBeUndefined();
    expect(history.find((entry) => entry.attemptId === "attempt-2")?.completedAt).toBe(
      "2026-06-10T12:00:00.000Z"
    );
  });

  it("does not create an entry when completion has no generated history", () => {
    completePuzzleHistory({
      attemptId: "attempt-1",
      puzzle: createGeneratedRecord().puzzle,
      completedBoard: createSolvedBoardFixture(),
      completedAt: "2026-06-10T12:00:00.000Z",
      elapsedMs: 125_000
    });

    expect(loadSolvedPuzzleHistory()).toEqual([]);
  });

  it("keeps separate attempts for the same initial puzzle", () => {
    const first = createRecord({ completedAt: "2026-06-10T10:00:00.000Z" });
    const second = createRecord({ attemptId: "attempt-2", completedAt: "2026-06-10T12:00:00.000Z" });

    recordSolvedPuzzle(first);
    recordSolvedPuzzle(second);

    expect(loadSolvedPuzzleHistory()).toHaveLength(2);
    expect(loadSolvedPuzzleHistory().map((entry) => entry.attemptId)).toEqual(["attempt-2", "attempt-1"]);
  });

  it("uses the same puzzle id but keeps formatting variations as separate attempts", () => {
    const compactPuzzle = createSolvedPuzzleTextFixture({ row: 8, col: 8 });
    const formattedPuzzle = compactPuzzle
      .split("\n")
      .map((row) => `${row.slice(0, 5)} | ${row.slice(6, 11)} | ${row.slice(12)}`)
      .join("\n");

    recordSolvedPuzzle(createRecord({ puzzle: compactPuzzle }));
    recordSolvedPuzzle(
      createRecord({
        attemptId: "attempt-2",
        puzzle: formattedPuzzle,
        completedAt: "2026-06-10T13:00:00.000Z"
      })
    );

    const history = loadSolvedPuzzleHistory();
    expect(history).toHaveLength(2);
    expect(new Set(history.map((entry) => entry.puzzleId)).size).toBe(1);
  });

  it("keeps different initial puzzles even when their completed boards are identical", () => {
    recordSolvedPuzzle(createRecord());
    recordSolvedPuzzle(
      createRecord({
        attemptId: "attempt-2",
        puzzle: createSolvedPuzzleTextFixture({ row: 0, col: 0 }),
        completedAt: "2026-06-10T13:00:00.000Z"
      })
    );

    expect(loadSolvedPuzzleHistory()).toHaveLength(2);
  });

  it("keeps only the newest configured number of entries", () => {
    for (let index = 0; index < HISTORY_LIMIT + 3; index += 1) {
      const puzzle = createSolvedPuzzleTextFixture({
        row: Math.floor(index / 9) % 9,
        col: index % 9
      });
      recordSolvedPuzzle(
        createRecord({
          attemptId: `attempt-${index}`,
          puzzle,
          completedAt: new Date(Date.UTC(2026, 0, 1, 0, index)).toISOString()
        })
      );
    }

    const history = loadSolvedPuzzleHistory();

    expect(history).toHaveLength(HISTORY_LIMIT);
    expect(history[0].completedAt).toBe(new Date(Date.UTC(2026, 0, 1, 0, HISTORY_LIMIT + 2)).toISOString());
  });

  it("filters malformed entries while preserving valid entries", () => {
    recordSolvedPuzzle(createRecord());
    const valid = loadSolvedPuzzleHistory()[0];
    clearSolvedPuzzleHistory();

    seedStorage(
      STORAGE_KEY,
      JSON.stringify([
        valid,
        { ...valid, completedAt: "not-a-date" },
        { ...valid, difficulty: "expert" },
        { ...valid, completedBoard: [] },
        null
      ])
    );

    expect(loadSolvedPuzzleHistory()).toEqual([valid]);
  });

  it("returns an empty list for broken JSON or a non-array root", () => {
    seedStorage(STORAGE_KEY, "{broken}");
    expect(loadSolvedPuzzleHistory()).toEqual([]);

    seedStorage(STORAGE_KEY, JSON.stringify({ entries: [] }));
    expect(loadSolvedPuzzleHistory()).toEqual([]);
  });

  it("ignores read, write, and clear storage failures", () => {
    const getItemSpy = vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("read failed");
    });
    expect(loadSolvedPuzzleHistory()).toEqual([]);
    getItemSpy.mockRestore();

    const setItemSpy = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("quota");
    });
    expect(() => recordSolvedPuzzle(createRecord())).not.toThrow();
    setItemSpy.mockRestore();

    const removeItemSpy = vi.spyOn(Storage.prototype, "removeItem").mockImplementation(() => {
      throw new Error("clear failed");
    });
    expect(() => clearSolvedPuzzleHistory()).not.toThrow();
    removeItemSpy.mockRestore();
  });

  it("is a no-op when recording or clearing without window", () => {
    withWindowUndefined(() => {
      expect(() => recordSolvedPuzzle(createRecord())).not.toThrow();
      expect(() => clearSolvedPuzzleHistory()).not.toThrow();
    });
  });

  it("clears all solved puzzle history", () => {
    recordSolvedPuzzle(createRecord());

    clearSolvedPuzzleHistory();

    expect(loadSolvedPuzzleHistory()).toEqual([]);
  });
});
