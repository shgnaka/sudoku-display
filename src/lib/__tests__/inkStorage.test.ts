import { beforeEach, describe, expect, it, vi } from "vitest";
import { STORAGE_KEYS } from "../../constants/storageKeys";
import { createEmptyInkState } from "../inkModel";
import { clearInkState, loadInkState, saveInkState } from "../inkStorage";
import { clearStorage, seedStorage } from "../../test-utils/browserMocks";
import type { BlockId } from "../../types/ink";

const STORAGE_KEY = STORAGE_KEYS.ink;

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

describe("inkStorage", () => {
  beforeEach(() => {
    clearStorage();
  });

  it("returns empty state when storage is empty", () => {
    expect(loadInkState()).toEqual(createEmptyInkState());
  });

  it("returns empty state when window is unavailable", () => {
    withWindowUndefined(() => {
      expect(loadInkState()).toEqual(createEmptyInkState());
    });
  });

  it("saves and loads ink state", () => {
    const state = createEmptyInkState();
    state["1-1"] = [
      {
        points: [
          { x: 0.1, y: 0.2 },
          { x: 0.7, y: 0.6 }
        ],
        color: "#111111",
        width: 2,
        ts: 123
      }
    ];

    saveInkState(state);

    expect(loadInkState()).toEqual(state);
  });

  it("falls back safely when stored json is broken", () => {
    seedStorage(STORAGE_KEY, "{broken}");

    expect(loadInkState()).toEqual(createEmptyInkState());
  });

  it.each<{
    name: string;
    blockId: BlockId;
    payload: unknown;
  }>([
    {
      name: "drops non-object point",
      blockId: "0-0",
      payload: {
        "0-0": [
          {
            points: ["x"],
            color: "#111111",
            width: 2,
            ts: 123
          }
        ]
      }
    },
    {
      name: "drops points with non-finite values",
      blockId: "0-0",
      payload: {
        "0-0": [
          {
            points: [{ x: Number.NaN, y: 0.2 }],
            color: "#111111",
            width: 2,
            ts: 123
          }
        ]
      }
    },
    {
      name: "drops points with out-of-range values",
      blockId: "0-0",
      payload: {
        "0-0": [
          {
            points: [{ x: 1.2, y: 0.2 }],
            color: "#111111",
            width: 2,
            ts: 124
          }
        ]
      }
    },
    {
      name: "drops points with invalid pressure",
      blockId: "0-0",
      payload: {
        "0-0": [
          {
            points: [{ x: 0.2, y: 0.3, pressure: "0.4" }],
            color: "#111111",
            width: 2,
            ts: 124
          }
        ]
      }
    },
    {
      name: "drops strokes with invalid stroke fields",
      blockId: "1-1",
      payload: {
        "1-1": [
          {
            points: "invalid",
            color: "#111111",
            width: 2,
            ts: 20
          },
          {
            points: [{ x: 0.3, y: 0.4 }],
            color: 100,
            width: 2,
            ts: 21
          },
          {
            points: [{ x: 0.3, y: 0.4 }],
            color: "#111111",
            width: 0,
            ts: 22
          },
          {
            points: [{ x: 0.3, y: 0.4 }],
            color: "#111111",
            width: 2,
            ts: "x"
          }
        ]
      }
    },
    {
      name: "normalizes non-array block value to empty",
      blockId: "2-2",
      payload: {
        "2-2": "invalid"
      }
    },
    {
      name: "normalizes non-object root to empty",
      blockId: "0-0",
      payload: [1, 2, 3]
    }
  ])("$name", ({ blockId, payload }) => {
    seedStorage(STORAGE_KEY, JSON.stringify(payload));

    expect(loadInkState()[blockId]).toEqual([]);
  });

  it("keeps only valid strokes when mixed data is stored", () => {
    const validStroke = {
      points: [{ x: 0.3, y: 0.4 }],
      color: "#111111",
      width: 2,
      ts: 10
    };

    seedStorage(
      STORAGE_KEY,
      JSON.stringify({
        "2-2": [
          validStroke,
          {
            points: [{ x: -0.1, y: 0.2 }],
            color: "#222222",
            width: 2,
            ts: 11
          }
        ]
      })
    );

    expect(loadInkState()["2-2"]).toEqual([validStroke]);
  });

  it("saveInkState ignores storage errors", () => {
    const state = createEmptyInkState();
    const setItemSpy = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("quota");
    });

    expect(() => saveInkState(state)).not.toThrow();
    setItemSpy.mockRestore();
  });

  it("saveInkState is no-op when window is unavailable", () => {
    withWindowUndefined(() => {
      expect(() => saveInkState(createEmptyInkState())).not.toThrow();
    });
  });

  it("clears storage", () => {
    const state = createEmptyInkState();
    state["0-0"] = [
      {
        points: [{ x: 0.3, y: 0.4 }],
        color: "#111111",
        width: 2,
        ts: 10
      }
    ];

    saveInkState(state);
    clearInkState();

    expect(window.localStorage.getItem(STORAGE_KEY)).toBeNull();
    expect(loadInkState()).toEqual(createEmptyInkState());
  });

  it("clearInkState ignores storage errors", () => {
    const removeItemSpy = vi.spyOn(Storage.prototype, "removeItem").mockImplementation(() => {
      throw new Error("quota");
    });

    expect(() => clearInkState()).not.toThrow();
    removeItemSpy.mockRestore();
  });

  it("clearInkState is no-op when window is unavailable", () => {
    withWindowUndefined(() => {
      expect(() => clearInkState()).not.toThrow();
    });
  });
});
