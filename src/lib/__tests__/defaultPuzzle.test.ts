import { afterEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_PUZZLE_FALLBACK_TEXT, loadDefaultPuzzleText } from "../defaultPuzzle";

describe("loadDefaultPuzzleText", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns fetched puzzle text when asset loading succeeds", async () => {
    const mockText = "1 2 3 | 4 5 6 | 7 8 9";
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      text: async () => mockText
    } as Response);

    await expect(loadDefaultPuzzleText()).resolves.toBe(mockText);
  });

  it("falls back to embedded puzzle when fetch response is not ok", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: false
    } as Response);

    await expect(loadDefaultPuzzleText()).resolves.toBe(DEFAULT_PUZZLE_FALLBACK_TEXT);
  });

  it("falls back to embedded puzzle when fetch throws", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("network error"));

    await expect(loadDefaultPuzzleText()).resolves.toBe(DEFAULT_PUZZLE_FALLBACK_TEXT);
  });
});
