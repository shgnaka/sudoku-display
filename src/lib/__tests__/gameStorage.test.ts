import { beforeEach, describe, expect, it, vi } from "vitest";
import { STORAGE_KEYS } from "../../constants/storageKeys";
import { clearGameState, loadGameState, saveGameState } from "../gameStorage";
import {
  createMalformedBoardFixture,
  createPersistedGameStateFixture
} from "../../test-utils/storageFixtures";
import { clearStorage, seedStorage } from "../../test-utils/browserMocks";

const STORAGE_KEY = STORAGE_KEYS.game;

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

describe("gameStorage", () => {
  beforeEach(() => {
    clearStorage();
  });

  it("saves and loads raw input + board", () => {
    const state = createPersistedGameStateFixture();

    saveGameState(state);

    expect(loadGameState()).toEqual(state);
  });

  it("returns null when window is unavailable", () => {
    withWindowUndefined(() => {
      expect(loadGameState()).toBeNull();
    });
  });

  it("returns null when storage is empty", () => {
    expect(loadGameState()).toBeNull();
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
      name: "returns null when parsed root is array",
      rawStorage: "[]"
    },
    {
      name: "returns null when board row count is invalid",
      rawStorage: JSON.stringify({ rawInput: "x", board: Array.from({ length: 8 }, () => []) })
    },
    {
      name: "returns null when board row cell count is invalid",
      rawStorage: JSON.stringify({
        rawInput: "x",
        board: Array.from({ length: 9 }, (_, index) =>
          Array.from({ length: index === 0 ? 8 : 9 }, () => ({ value: null, origin: "empty" }))
        )
      })
    },
    {
      name: "rejects unknown origin",
      rawStorage: (() => {
        const board = createMalformedBoardFixture();
        board[0][0] = { value: 1, origin: "system" };
        return JSON.stringify({ rawInput: "x", board });
      })()
    },
    {
      name: "rejects non-string origin",
      rawStorage: (() => {
        const board = createMalformedBoardFixture();
        board[0][0] = { value: 1, origin: 10 };
        return JSON.stringify({ rawInput: "x", board });
      })()
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
    },
    {
      name: "rejects non-integer given value",
      rawStorage: (() => {
        const board = createMalformedBoardFixture();
        board[0][0] = { value: 1.5, origin: "given" };
        return JSON.stringify({ rawInput: "x", board });
      })()
    },
    {
      name: "rejects out-of-range given value",
      rawStorage: (() => {
        const board = createMalformedBoardFixture();
        board[0][0] = { value: 10, origin: "given" };
        return JSON.stringify({ rawInput: "x", board });
      })()
    },
    {
      name: "rejects non-object cell",
      rawStorage: (() => {
        const board = createMalformedBoardFixture();
        board[0][0] = 1;
        return JSON.stringify({ rawInput: "x", board });
      })()
    }
  ])("$name", ({ rawStorage }) => {
    seedStorage(STORAGE_KEY, rawStorage);

    expect(loadGameState()).toBeNull();
  });

  it("saveGameState ignores storage errors", () => {
    const state = createPersistedGameStateFixture();
    const setItemSpy = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("quota");
    });

    expect(() => saveGameState(state)).not.toThrow();
    setItemSpy.mockRestore();
  });

  it("saveGameState is no-op when window is unavailable", () => {
    const state = createPersistedGameStateFixture();

    withWindowUndefined(() => {
      expect(() => saveGameState(state)).not.toThrow();
    });
  });

  it("clearGameState removes persisted data", () => {
    const state = createPersistedGameStateFixture();
    saveGameState(state);

    clearGameState();

    expect(loadGameState()).toBeNull();
  });

  it("clearGameState ignores storage errors", () => {
    const removeItemSpy = vi.spyOn(Storage.prototype, "removeItem").mockImplementation(() => {
      throw new Error("quota");
    });

    expect(() => clearGameState()).not.toThrow();
    removeItemSpy.mockRestore();
  });

  it("clearGameState is no-op when window is unavailable", () => {
    withWindowUndefined(() => {
      expect(() => clearGameState()).not.toThrow();
    });
  });
});
