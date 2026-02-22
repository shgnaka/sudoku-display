import { beforeEach, describe, expect, it } from "vitest";
import { STORAGE_KEYS } from "../../constants/storageKeys";
import { loadGameState, saveGameState } from "../gameStorage";

const STORAGE_KEY = STORAGE_KEYS.game;

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

function createMalformedBoard() {
  return createBoard().map((row) => row.map((cell) => ({ ...cell }))) as Array<
    Array<{
      value: unknown;
      origin: unknown;
    }>
  >;
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

  it("rejects given cell with null value", () => {
    const board = createMalformedBoard();
    board[0][0] = { value: null, origin: "given" };

    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        rawInput: "x",
        board
      })
    );

    expect(loadGameState()).toBeNull();
  });

  it("rejects user cell with null value", () => {
    const board = createMalformedBoard();
    board[0][2] = { value: null, origin: "user" };

    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        rawInput: "x",
        board
      })
    );

    expect(loadGameState()).toBeNull();
  });

  it("rejects empty cell with numeric value", () => {
    const board = createMalformedBoard();
    board[1][1] = { value: 5, origin: "empty" };

    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        rawInput: "x",
        board
      })
    );

    expect(loadGameState()).toBeNull();
  });
});
