import type { Board } from "../types/sudoku";
import type { PersistedGameState } from "../lib/gameStorage";

export function createGameBoardFixture(): Board {
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

export function createPersistedGameStateFixture(): PersistedGameState {
  return {
    rawInput: "5 3 . | . 7 . | . . .",
    board: createGameBoardFixture()
  };
}

export function createMalformedBoardFixture(): Array<
  Array<{
    value: unknown;
    origin: unknown;
  }>
> {
  return createGameBoardFixture().map((row) => row.map((cell) => ({ ...cell })));
}
