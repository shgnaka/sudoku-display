export type SudokuDifficulty = "easy" | "medium" | "hard";

export interface GeneratedSudoku {
  puzzle: Uint8Array;
  solution: Uint8Array;
  clues: number;
  difficulty: SudokuDifficulty;
  seed: bigint;
}

interface WasmGeneratedPuzzle {
  clues: number;
  difficulty: string;
  seed: bigint;
  puzzle: () => Uint8Array;
  solution: () => Uint8Array;
}

interface WasmSudokuModule {
  default: () => Promise<void>;
  generate_sudoku: (difficulty: string, seed: bigint) => WasmGeneratedPuzzle;
}

let modulePromise: Promise<WasmSudokuModule> | null = null;

function createSeed(): bigint {
  if (typeof window !== "undefined" && window.crypto?.getRandomValues) {
    const value = new BigUint64Array(1);
    window.crypto.getRandomValues(value);
    return value[0];
  }

  return BigInt(Date.now());
}

async function loadModule(): Promise<WasmSudokuModule> {
  if (!modulePromise) {
    const modulePath = `${import.meta.env.BASE_URL}wasm/pkg/sudoku_generator.js`;

    modulePromise = import(/* @vite-ignore */ modulePath).then(async (module) => {
      const wasmModule = module as WasmSudokuModule;
      await wasmModule.default();
      return wasmModule;
    });
  }

  return modulePromise;
}

function normalizeDifficulty(value: string): SudokuDifficulty {
  const normalized = value.toLowerCase();
  if (normalized === "easy" || normalized === "medium" || normalized === "hard") {
    return normalized;
  }

  return "medium";
}

export async function generateSudoku(
  difficulty: SudokuDifficulty,
  seed: bigint = createSeed()
): Promise<GeneratedSudoku> {
  const wasmModule = await loadModule();
  const generated = wasmModule.generate_sudoku(difficulty, seed);

  return {
    puzzle: generated.puzzle(),
    solution: generated.solution(),
    clues: generated.clues,
    difficulty: normalizeDifficulty(generated.difficulty),
    seed: generated.seed
  };
}
