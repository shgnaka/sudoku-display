import { afterEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_SUDOKU_DIFFICULTY } from "../../constants/difficulty";

interface LoadSubjectOptions {
  generatedDifficulty?: string;
}

async function loadSubject(options: LoadSubjectOptions = {}) {
  vi.resetModules();
  const generatedDifficulty = options.generatedDifficulty ?? "hard";
  const initModule = vi.fn(async () => undefined);
  const generateSudokuRaw = vi.fn((difficulty: string, seed: bigint) => ({
    clues: 31,
    difficulty: generatedDifficulty,
    seed,
    puzzle: () => new Uint8Array([1, 2, 3]),
    solution: () => new Uint8Array([9, 8, 7])
  }));

  vi.doMock("../../constants/wasm", () => ({
    SUDOKU_GENERATOR_MODULE_PATH: "virtual:mock-sudoku-generator"
  }));
  vi.doMock(
    "virtual:mock-sudoku-generator",
    () => ({
      default: initModule,
      generate_sudoku: generateSudokuRaw
    }),
    { virtual: true }
  );

  const subject = await import("../sudokuGenerator");
  return { ...subject, initModule, generateSudokuRaw };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("sudokuGenerator", () => {
  it("generates sudoku with explicit seed and mapped result", async () => {
    const { generateSudoku, initModule, generateSudokuRaw } = await loadSubject();

    const result = await generateSudoku("hard", 123n);

    expect(initModule).toHaveBeenCalledTimes(1);
    expect(generateSudokuRaw).toHaveBeenCalledWith("hard", 123n);
    expect(result).toEqual({
      clues: 31,
      difficulty: "hard",
      seed: 123n,
      puzzle: new Uint8Array([1, 2, 3]),
      solution: new Uint8Array([9, 8, 7])
    });
  });

  it("normalizes unknown wasm difficulty to default", async () => {
    const { generateSudoku } = await loadSubject({ generatedDifficulty: "unknown" });

    const result = await generateSudoku("easy", 7n);

    expect(result.difficulty).toBe(DEFAULT_SUDOKU_DIFFICULTY);
  });

  it("uses crypto random seed when available", async () => {
    const getRandomValues = vi.fn((value: BigUint64Array) => {
      value[0] = 42n;
      return value;
    });
    vi.stubGlobal("crypto", { getRandomValues });
    const { generateSudoku, generateSudokuRaw } = await loadSubject();

    await generateSudoku("medium");

    expect(generateSudokuRaw).toHaveBeenCalledWith("medium", 42n);
  });

  it("falls back to Date.now when crypto is unavailable", async () => {
    vi.stubGlobal("crypto", undefined);
    const nowSpy = vi.spyOn(Date, "now").mockReturnValue(1000);
    const { generateSudoku, generateSudokuRaw } = await loadSubject();

    await generateSudoku("easy");

    expect(generateSudokuRaw).toHaveBeenCalledWith("easy", 1000n);
    nowSpy.mockRestore();
  });

  it("initializes wasm module once across multiple calls", async () => {
    const { generateSudoku, initModule, generateSudokuRaw } = await loadSubject();

    await generateSudoku("easy", 1n);
    await generateSudoku("hard", 2n);

    expect(initModule).toHaveBeenCalledTimes(1);
    expect(generateSudokuRaw).toHaveBeenCalledTimes(2);
  });
});
