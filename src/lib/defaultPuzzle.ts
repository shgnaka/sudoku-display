export const DEFAULT_PUZZLE_FALLBACK_TEXT = `5 3 . | . 7 . | . . .
6 . . | 1 9 5 | . . .
. 9 8 | . . . | . 6 .
------+-------+------
8 . . | . 6 . | . . 3
4 . . | 8 . 3 | . . 1
7 . . | . 2 . | . . 6
------+-------+------
. 6 . | . . . | 2 8 .
. . . | 4 1 9 | . . 5
. . . | . 8 . | . 7 9`;

const DEFAULT_PUZZLE_ASSET_PATH = `${import.meta.env.BASE_URL}puzzles/default.txt`;

export async function loadDefaultPuzzleText(): Promise<string> {
  if (typeof fetch !== "function") {
    return DEFAULT_PUZZLE_FALLBACK_TEXT;
  }

  try {
    const response = await fetch(DEFAULT_PUZZLE_ASSET_PATH, { cache: "no-cache" });
    if (!response.ok) {
      return DEFAULT_PUZZLE_FALLBACK_TEXT;
    }

    const text = (await response.text()).trim();
    return text.length > 0 ? text : DEFAULT_PUZZLE_FALLBACK_TEXT;
  } catch {
    return DEFAULT_PUZZLE_FALLBACK_TEXT;
  }
}
