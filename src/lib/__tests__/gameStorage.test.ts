import { beforeEach, describe, expect, it } from "vitest";
import { STORAGE_KEYS } from "../../constants/storageKeys";
import { loadGameState, saveGameState } from "../gameStorage";
import {
  createMalformedBoardFixture,
  createPersistedGameStateFixture
} from "../../test-utils/storageFixtures";

const STORAGE_KEY = STORAGE_KEYS.game;

describe("gameStorage", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("saves and loads raw input + board", () => {
    const state = createPersistedGameStateFixture();

    saveGameState(state);

    expect(loadGameState()).toEqual(state);
  });

  it.each([
    {
      name: "returns null for malformed data",
      rawStorage: '{"rawInput":123,"board":[]}'
    },
    {
      name: "returns null when json is broken",
      rawStorage: "{broken}"
    },
    {
      name: "rejects given cell with null value",
      rawStorage: (() => {
        const board = createMalformedBoardFixture();
        board[0][0] = { value: null, origin: "given" };
        return JSON.stringify({ rawInput: "x", board });
      })()
    },
    {
      name: "rejects user cell with null value",
      rawStorage: (() => {
        const board = createMalformedBoardFixture();
        board[0][2] = { value: null, origin: "user" };
        return JSON.stringify({ rawInput: "x", board });
      })()
    },
    {
      name: "rejects empty cell with numeric value",
      rawStorage: (() => {
        const board = createMalformedBoardFixture();
        board[1][1] = { value: 5, origin: "empty" };
        return JSON.stringify({ rawInput: "x", board });
      })()
    }
  ])("$name", ({ rawStorage }) => {
    window.localStorage.setItem(
      STORAGE_KEY,
      rawStorage
    );

    expect(loadGameState()).toBeNull();
  });
});
