import { beforeEach, describe, expect, it } from "vitest";
import { STORAGE_KEYS } from "../../constants/storageKeys";
import { createEmptyInkState } from "../inkModel";
import { clearInkState, loadInkState, saveInkState } from "../inkStorage";

const STORAGE_KEY = STORAGE_KEYS.ink;

describe("inkStorage", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("returns empty state when storage is empty", () => {
    expect(loadInkState()).toEqual(createEmptyInkState());
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
    window.localStorage.setItem(STORAGE_KEY, "{broken}");

    expect(loadInkState()).toEqual(createEmptyInkState());
  });

  it.each([
    {
      name: "drops strokes with invalid points",
      blockId: "0-0",
      payload: {
        "0-0": [
          {
            points: [{ x: "0.1", y: 0.2 }],
            color: "#111111",
            width: 2,
            ts: 123
          },
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
    }
  ])("$name", ({ blockId, payload }) => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));

    expect(loadInkState()[blockId]).toEqual([]);
  });

  it("keeps only valid strokes when mixed data is stored", () => {
    const validStroke = {
      points: [{ x: 0.3, y: 0.4 }],
      color: "#111111",
      width: 2,
      ts: 10
    };

    window.localStorage.setItem(
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
});
