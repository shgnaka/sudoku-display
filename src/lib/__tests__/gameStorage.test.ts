import { beforeEach, describe, expect, it } from "vitest";
import { loadGameState, saveGameState } from "../gameStorage";

const STORAGE_KEY = "sudoku-display:game:v1";

function createBoard() {
  return Array.from({ length: 9 }, (_, row) =>
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
}

describe("gameStorage", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("saves and loads raw input + board", () => {
    const state = {
      rawInput: "5 3 . | . 7 . | . . .",
      board: createBoard()
    };

    saveGameState(state);

    expect(loadGameState()).toEqual(state);
  });

  it("returns null for malformed data", () => {
    window.localStorage.setItem(STORAGE_KEY, '{"rawInput":123,"board":[]}');

    expect(loadGameState()).toBeNull();
  });

  it("returns null when json is broken", () => {
    window.localStorage.setItem(STORAGE_KEY, "{broken}");

    expect(loadGameState()).toBeNull();
  });
});
